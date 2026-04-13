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
You are a deterministic AI recruitment scoring engine. You MUST evaluate ALL data sources for EACH candidate.

## JOB REQUIREMENTS
${JSON.stringify(job, null, 2)}

Evaluate against:
- required_skills (MUST-HAVE)
- preferred_skills (bonus)
- experience_level (seniority)
- responsibilities (duties)
- required_documents (MUST submit): ${JSON.stringify(job.required_documents || [])}
- application_questions (MUST answer): ${JSON.stringify(job.application_questions || [])}

## CANDIDATES
${JSON.stringify(candidates, null, 2)}

For EACH candidate, evaluate ALL these data sources:

1. PROFILE FIELDS FIRST: skills[], experience[], projects[], education[], certifications[] - these are pre-extracted from CSV
2. BIO (supplementary): Contains raw CSV data with ALL fields - use this to find ADDITIONAL information not in structured fields
3. CV_TEXT: scan for additional skills, experience, projects not in profile or bio
4. COVER_LETTER: assess quality, interest, role alignment, additional info
5. APPLICATION_ANSWERS: evaluate specificity and depth of EACH answer (vague = negative)
6. ATTACHED_DOCUMENTS: validate ALL required documents present, correct type, quality

IMPORTANT FOR CSV IMPORTS:
- Check skills[], experience[], education[], projects[], certifications[] arrays FIRST - they contain extracted CSV data
- If arrays are empty, look in bio field which has format "fieldName: value" on each line
- The bio field contains ALL CSV columns as backup
- Extract skills, experience, education, projects from structured arrays OR bio field
- Be flexible - if structured fields have data, use them; if not, extract from bio
- Cross-reference both sources for complete picture

## SCORING

**Skills (40%):**
1. Check skills[] array first - contains extracted CSV skills
2. If skills[] empty or incomplete, extract from bio field (line-by-line format)
3. Also scan cv_text, cover_letter, application_answers for MORE skills
4. Match required_skills (case-insensitive, partial match OK)
5. base = (matched/total) × 100
6. +5 per preferred_skill (cap +20)
7. +2 per Advanced/Expert skill (cap +10)
8. Apply document penalties

**Experience (30%):**
Check experience[] array first, then bio field, then cv_text
Seniority from experience[]: none(0y)|intern(<1y)|junior(1-2y)|mid(3-5y)|senior(6-9y)|lead(10+y)
Matrix: none[30,10,0,0,0] intern[80,50,20,5,0] junior[70,85,55,25,10] mid[60,75,90,65,35] senior[50,65,80,95,75] lead[40,55,70,85,100]
Domain: same(+0)|related(-10)|unrelated(-25)
Extract years/duration from experience[].description or bio field

**Projects (20%):**
Check projects[] array first, then bio field, then cv_text
0=10|irrelevant=20|1=50|2=70|3+=85
+5 per project with 2+ required_skills (cap +15)

**Education (10%):**
Check education[] array first, then bio field, then cv_text
none=25|unrelated=35|loosely=55|related=75|+certs=85|+multi=95

**Documents (penalties on skills):**
For EACH required document:
- Missing: -10 (cap -30)
- Wrong type: -8 (CV has experience/skills, Certificate has issuer/date, Diploma has degree/institution/date, Portfolio has projects/links, Cover Letter is letter format, Transcript has courses/grades)
- Low quality: -5
- High quality: mention in strengths

## FORMULA
match_score = (skills×0.4)+(experience×0.3)+(projects×0.2)+(education×0.1)

IMPORTANT: Return the EXACT breakdown scores. The server will recompute match_score using this formula.
Example: skills=85, experience=70, projects=60, education=75
match_score = (85×0.4)+(70×0.3)+(60×0.2)+(75×0.1) = 34+21+12+7.5 = 74.5

Recommendation: 80-100=Strongly|60-79=Recommend|40-59=Consider|0-39=Do Not

## OUTPUT
Score ALL ${candidates.length}. Return top ${topN}.

{
  "job_summary": {"role":"${job.title}", "key_requirements":[], "must_have_skills":${JSON.stringify(job.required_skills)}, "preferred_skills":${JSON.stringify(job.preferred_skills)}},
  "ranking": [{
    "rank": 1,
    "candidate_id": "",
    "name": "",
    "match_score": 0,
    "score_breakdown": {"skills":0, "experience":0, "education":0, "projects":0},
    "strengths": ["MUST name specific skills/companies/projects/documents from data"],
    "gaps": ["List ALL missing required_skills AND missing/wrong/low-quality documents"],
    "reason": "Sentence 1: fit+score. Sentence 2: best evidence (profile/CV/docs/answers). Sentence 3: biggest gap.",
    "recommendation": ""
  }]
}

CRITICAL:
- CSV imports have data in BOTH structured arrays (skills[], experience[], education[], projects[], certifications[]) AND bio field
- Check structured arrays FIRST - they contain pre-extracted CSV data
- Use bio field as supplementary source if arrays are incomplete
- Cross-reference all sources: structured fields + bio + cv_text + cover_letter + application_answers + attached_documents
- Be flexible with field names in bio - extract meaning, not just exact matches
- Validate ALL required documents
- Assess ALL application answers
- Never invent data - if no data exists, score low and mention in gaps
- Never skip evaluation areas
- Return ONLY JSON
`;;

// Available models from API (verified via listModels)
const MODELS = [
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-3-flash-preview",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
];

const parseOutput = (text: string, topN: number): ScreeningOutput => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(clean) as ScreeningOutput;
  parsed.ranking = parsed.ranking
    .map((c) => {
      // Recompute match_score from breakdown to guarantee formula consistency
      const computed = (
        (c.score_breakdown.skills * 0.4) +
        (c.score_breakdown.experience * 0.3) +
        (c.score_breakdown.projects * 0.2) +
        (c.score_breakdown.education * 0.1)
      );
      // Round to 1 decimal place
      const rounded = Math.round(computed * 10) / 10;
      return {
        ...c,
        match_score: rounded,
      };
    })
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
  console.log(`[AI] Prompt: ${prompt.length} chars, ${candidates.length} candidates`);
  
  let lastError: Error = new Error("No models available");

  for (const modelName of MODELS) {
    try {
      console.log(`[AI] Trying: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`[AI] Response received: ${text.length} chars`);
      const output = parseOutput(text, topN);
      console.log(`[AI] ✓ Success with ${modelName}: ${output.ranking.length} candidates ranked`);
      return output;
    } catch (err: any) {
      console.warn(`[AI] ✗ ${modelName} failed: ${err.message?.slice(0, 150)}`);
      lastError = err;
    }
  }

  throw new Error(`All models failed. Last: ${lastError.message?.slice(0, 150)}`);
};
