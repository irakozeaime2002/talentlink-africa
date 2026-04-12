import { GoogleGenerativeAI } from "@google/generative-ai";
import { JobInput, CandidateInput, ScreeningOutput } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * AI DECISION FLOW (documented per hackathon requirements):
 *
 * SCORING WEIGHTS:
 *   - Skills relevance:          40%  (technical match to required + preferred skills)
 *   - Experience relevance:      30%  (years, seniority, domain relevance)
 *   - Projects / practical work: 20%  (real-world evidence of skills)
 *   - Education:                 10%  (degree, field, institution prestige)
 *
 * FORMULA:
 *   match_score = (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)
 *
 * RANKING:
 *   All candidates are ranked highest → lowest by match_score.
 *   Top N (10 or 20) are returned.
 *
 * EXPLAINABILITY:
 *   Each candidate includes: strengths[], gaps[], reason (narrative), recommendation.
 *   Gemini is instructed NOT to fabricate data — missing info is flagged explicitly.
 *
 * MODEL: gemini-2.5-flash (latest available on this API key)
 */

const buildPrompt = (job: JobInput, candidates: CandidateInput[], topN: number): string => `
You are a deterministic AI recruitment scoring engine. You must produce identical scores every time you receive the same input. There is no room for interpretation — follow every rule exactly.

---

## STEP 1 — UNDERSTAND THE JOB

${JSON.stringify(job, null, 2)}

Before scoring, extract:
- required_skills: the non-negotiable technical skills
- preferred_skills: bonus skills that improve fit
- experience_level: the seniority bar (intern / junior / mid / senior / lead)
- responsibilities: what the person will actually do day-to-day

---

## STEP 2 — UNDERSTAND THE CANDIDATES

${JSON.stringify(candidates, null, 2)}

For each candidate, read:
- skills[]: their declared technical skills
- experience[]: job titles, companies, durations, descriptions
- projects[]: project names, descriptions, technologies used
- education[]: degree, field, institution, year
- certifications[]: any professional certifications
- cv_text (if present): raw CV text — treat as additional evidence for ALL dimensions.
- cover_letter (if present): assess communication quality, role alignment, and genuine interest.
- application_answers (if present): CRITICAL — evaluate how specifically and thoughtfully each question was answered. Vague or empty answers are a strong negative signal.
- attached_documents (if present): text extracted from uploaded documents labeled by filename. Read ALL carefully.
  - Cross-check each document against the job's required_documents list: ${JSON.stringify(job.required_documents || [])}.
  - For each required document: does the candidate's attached_documents contain it? Does the content match what is expected (e.g. a CV should list experience/skills, a certificate should show a qualification, a portfolio should show real work)?
  - A required document that is MISSING → flag as a gap and penalize skills score by 10 points per missing document (capped at -30).
  - A required document that is PRESENT but has LOW QUALITY content (e.g. a CV with no skills or experience, a blank portfolio) → flag as a gap and penalize by 5 points.
  - A required document that is PRESENT and HIGH QUALITY → treat as a positive signal and use its content as evidence across all dimensions.

---

## STEP 3 — SCORE EACH DIMENSION (0–100)

You MUST follow these rubrics exactly. Do not use your own judgment outside these rules.

### DIMENSION 1 — skills (contributes 40% to final score)

Algorithm:
1. Count how many of the job's required_skills appear in the candidate's skills list (case-insensitive, partial match allowed e.g. "React" matches "React.js").
2. base = (matched_required / total_required) × 100
3. For each preferred_skill matched, add 5 points (bonus capped at 20).
4. If cv_text exists, scan it for additional skill mentions not in skills[] and count those too.
5. If cover_letter or application_answers exist, scan them for skill mentions as additional evidence.
6. Final skills score = MIN(base + bonus, 100)

Examples:
- 0 of 4 required matched → 0 + bonus → skills = 0–20
- 2 of 4 required matched → 50 + bonus → skills = 50–70
- 4 of 4 required matched → 100 + bonus capped → skills = 100

### DIMENSION 2 — experience (contributes 30% to final score)

Algorithm:
1. Determine candidate's seniority from their experience entries (titles + durations):
   - No experience = "none"
   - < 1 year total = "intern"
   - 1–2 years = "junior"
   - 3–5 years = "mid"
   - 6–9 years = "senior"
   - 10+ years or "lead/head/director" title = "lead"
2. Compare candidate seniority to job experience_level using this fixed matrix:

   Candidate \ Job  | intern | junior | mid | senior | lead
   none             |  30    |  10    |  0  |   0    |   0
   intern           |  80    |  50    | 20  |   5    |   0
   junior           |  70    |  85    | 55  |  25    |  10
   mid              |  60    |  75    | 90  |  65    |  35
   senior           |  50    |  65    | 80  |  95    |  75
   lead             |  40    |  55    | 70  |  85    | 100

3. Domain relevance adjustment:
   - Experience is in the same technical domain as the job → +0 (no penalty)
   - Experience is in a related domain (e.g. backend dev applying for fullstack) → -10
   - Experience is in an unrelated domain → -25
4. Final experience score = MAX(0, matrix_value + domain_adjustment)

### DIMENSION 3 — projects (contributes 20% to final score)

Algorithm:
1. Count relevant projects: a project is relevant if its description or technologies overlap with required_skills or responsibilities.
2. Apply this scale:
   - 0 projects total → 10
   - Projects exist but none are relevant → 20
   - 1 relevant project → 50
   - 2 relevant projects → 70
   - 3+ relevant projects → 85
3. Quality bonus: for each relevant project that uses 2+ required_skills as technologies → +5 (capped at +15)
4. If cv_text or application_answers mention additional projects not in projects[], count those too.
5. Final projects score = MIN(base + quality_bonus, 100)

### DIMENSION 4 — education (contributes 10% to final score)

Algorithm:
1. Apply this fixed scale:
   - No education data → 25
   - Degree in unrelated field → 35
   - Degree in loosely related field (e.g. business for a PM role) → 55
   - Degree in directly related field (e.g. Computer Science for a software role) → 75
   - Directly related degree + relevant certifications → 85
   - Directly related degree + multiple relevant certifications → 95
2. Do NOT penalize candidates for not having a degree if they have strong skills/experience.

---

## STEP 4 — COMPUTE FINAL SCORE

You MUST use this exact formula:
match_score = (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)
Round to 1 decimal place.

Derive recommendation strictly from match_score — no exceptions:
- 80–100 → "Strongly Recommend"
- 60–79  → "Recommend"
- 40–59  → "Consider"
- 0–39   → "Do Not Recommend"

---

## STEP 5 — BUILD OUTPUT

For each candidate:
- strengths[]: 2–5 bullet points. Each MUST name a specific skill, job title, company, project, document, or notable answer from the data. No vague statements like "strong background".
- gaps[]: list every required_skill not found in the candidate's profile AND every required document that is missing or low quality. If no gaps, return ["No significant gaps"].
- reason: exactly 2–3 sentences. Sentence 1: overall fit summary with score. Sentence 2: strongest evidence (including document quality or answer quality if notable). Sentence 3: biggest gap or risk (missing documents, weak answers, or skill gaps).

---

## FINAL RULES
1. Score ALL ${candidates.length} candidates.
2. Return ONLY the top ${topN} sorted by match_score descending.
3. Never invent skills, titles, or projects not present in the data.
4. Never give two candidates the same rank.
5. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.

## OUTPUT FORMAT
{
  "job_summary": {
    "role": "",
    "key_requirements": [],
    "must_have_skills": [],
    "preferred_skills": []
  },
  "ranking": [
    {
      "rank": 1,
      "candidate_id": "",
      "name": "",
      "match_score": 0,
      "score_breakdown": {
        "skills": 0,
        "experience": 0,
        "education": 0,
        "projects": 0
      },
      "strengths": [],
      "gaps": [],
      "reason": "",
      "recommendation": ""
    }
  ]
}
`;

// Free-tier fallback list — tried in order until one succeeds
const MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-pro-latest",
];

const parseOutput = (text: string, topN: number): ScreeningOutput => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(clean) as ScreeningOutput;
  parsed.ranking = parsed.ranking
    .map((c) => ({
      ...c,
      // Always recompute match_score from breakdown to guarantee formula consistency
      match_score: Math.round(
        ((c.score_breakdown.skills * 0.4) +
         (c.score_breakdown.experience * 0.3) +
         (c.score_breakdown.projects * 0.2) +
         (c.score_breakdown.education * 0.1)) * 10
      ) / 10,
    }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, topN)
    .map((c, i) => ({ ...c, rank: i + 1 }));
  return parsed;
};

export const screenCandidates = async (
  job: JobInput,
  candidates: CandidateInput[],
  topN = 20
): Promise<ScreeningOutput> => {
  const prompt = buildPrompt(job, candidates, topN);
  let lastError: Error = new Error("No models available");

  for (const modelName of MODELS) {
    try {
      console.log(`[AI] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const output = parseOutput(text, topN);
      console.log(`[AI] Success with ${modelName}, ranked ${output.ranking.length} candidates`);
      return output;
    } catch (err: any) {
      const is503 = err.message?.includes("503");
      const is429 = err.message?.includes("429");
      const is404 = err.message?.includes("404");
      console.warn(`[AI] ${modelName} failed: ${is503 ? "503 Unavailable" : is429 ? "429 Quota" : is404 ? "404 Not Found" : err.message?.slice(0, 60)}`);
      lastError = err;
      // Only retry next model on 503/429/404 — not on JSON parse errors
      if (!is503 && !is429 && !is404) break;
    }
  }

  throw new Error(`All Gemini models unavailable. Last error: ${lastError.message?.slice(0, 120)}`);
};
