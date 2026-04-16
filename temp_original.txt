import { GoogleGenerativeAI } from "@google/generative-ai";
import { JobInput, CandidateInput, ScreeningOutput } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * AI Screening Service - The brain behind candidate evaluation
 * 
 * This service uses Google Gemini to automatically screen job applicants and rank them
 * based on how well they match the job requirements. Think of it as a smart assistant
 * that reads through hundreds of resumes and picks out the best candidates.
 * 
 * How we score candidates:
 *   - Skills (40%) - Do they have the technical skills we need?
 *   - Experience (30%) - Have they done similar work before?
 *   - Projects (20%) - Can they show real examples of their work?
 *   - Education (10%) - Do they have relevant qualifications?
 * 
 * The final score is: (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)
 * 
 * Why these weights? Skills matter most because you can't fake technical ability.
 * Experience comes second because past work predicts future performance.
 * Projects show practical application, and education provides foundational knowledge.
 * 
 * We try multiple Gemini models in sequence - if one is down or rate-limited,
 * we automatically fall back to the next one. This keeps the system reliable even
 * during high traffic or API issues.
 * 
 * The AI gives us more than just a score - it explains WHY each candidate is a good
 * (or bad) fit, listing their strengths, gaps, and a human-readable recommendation.
 */

/**
 * Builds the prompt that tells Gemini exactly how to evaluate candidates
 * 
 * This is where the magic happens - we give the AI very specific instructions
 * on how to score each dimension, what to look for, and how to format the output.
 * The more specific we are here, the more consistent and reliable the results.
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
1. Count EXACT matches between candidate skills[] and required_skills (case-insensitive)
2. base = (matched_count / required_skills.length) × 100
3. For EACH preferred_skill found in candidate skills[]: +5 (max +20 total)
4. For EACH skill with level="Advanced" or "Expert": +2 (max +10 total)
5. Final skills score = base + bonuses (cap at 100)

Example: Job requires ["Python", "SQL", "AWS"], candidate has ["Python", "SQL", "Docker"]
- Matched: 2/3 = 66.67
- If Docker is preferred: +5 = 71.67
- If Python is Advanced: +2 = 73.67

**Experience (30%):**
1. Calculate total years from experience[] array (sum all durations)
2. Map to seniority: 0y=none, <1y=intern, 1-2y=junior, 3-5y=mid, 6-9y=senior, 10+y=lead
3. Use this EXACT matrix based on job experience_level:
   - If job=Entry: none=30, intern=80, junior=70, mid=60, senior=50, lead=40
   - If job=Mid: none=10, intern=50, junior=85, mid=75, senior=65, lead=55
   - If job=Senior: none=0, intern=20, junior=55, mid=90, senior=80, lead=70
   - If job=Lead: none=0, intern=5, junior=25, mid=65, senior=95, lead=85
   - If job=Executive: none=0, intern=0, junior=10, mid=35, senior=75, lead=100
4. Check domain match: if ANY experience[].role or company relates to job industry: +0, else: -10
5. Final experience score = matrix_score + domain_adjustment

**Projects (20%):**
1. Count projects[] that mention ANY required_skill in technologies[] or description
2. Use EXACT scale: 0 relevant=10, 1 relevant=50, 2 relevant=70, 3+ relevant=85
3. For EACH project with 2+ required_skills in technologies[]: +5 (max +15 total)
4. Final projects score = base + bonuses (cap at 100)

**Education (10%):**
1. Check education[] array for degree related to job (CS/Engineering/Business/etc)
2. Use EXACT scale:
   - No education data: 25
   - Unrelated degree: 35
   - Loosely related: 55
   - Directly related Bachelor's: 75
   - Related degree + certifications[]: 85
   - Related degree + multiple certifications: 95
3. Final education score = scale_value (no adjustments)

**Documents (penalties applied to skills score):**
For EACH required document:
- Missing: -10 (max -30 total)
- Wrong type uploaded: -8
- Low quality/incomplete: -5
Apply penalties AFTER calculating base skills score

## FORMULA
match_score = (skills×0.4)+(experience×0.3)+(projects×0.2)+(education×0.1)

IMPORTANT: You MUST show your calculation work:
- Skills: "matched X/Y required = Z, +A preferred, +B advanced = FINAL"
- Experience: "W years = seniority_level, matrix[job_level][candidate_level] = X, domain = Y, FINAL = Z"
- Projects: "X relevant projects = base Y, +Z bonus = FINAL"
- Education: "degree_type + certs = FINAL"

Return the EXACT breakdown scores. The server will recompute match_score using this formula.
Example: skills=85, experience=70, projects=60, education=75
match_score = (85×0.4)+(70×0.3)+(60×0.2)+(75×0.1) = 34+21+12+7.5 = 74.5

Recommendation: 80-100="Strongly Recommend"|60-79="Recommend"|40-59="Consider"|0-39="Do Not Recommend"

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

// These are the Gemini models we'll try, in order of preference
// We verified these are available for our API key using the listModels endpoint
// If the first one fails (rate limit, downtime, etc), we automatically try the next
const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-3-flash-preview",
  "gemini-2.0-flash-lite",
  
];

/**
 * Parses the AI's response and double-checks the math
 * 
 * Even though we tell Gemini to use our exact formula, LLMs can sometimes
 * make small rounding errors. So we recalculate the final score ourselves
 * from the breakdown to guarantee it matches our formula perfectly.
 * 
 * We also re-sort and re-rank here to make sure the top candidates are
 * truly the highest scoring ones.
 */
const parseOutput = (text: string, topN: number): ScreeningOutput => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(clean) as ScreeningOutput;
  parsed.ranking = parsed.ranking
    .map((c) => {
      // Recalculate the score ourselves - don't trust the AI's math 100%
      const computed = (
        (c.score_breakdown.skills * 0.4) +
        (c.score_breakdown.experience * 0.3) +
        (c.score_breakdown.projects * 0.2) +
        (c.score_breakdown.education * 0.1)
      );
      // Keep one decimal place for precision without being overly specific
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

/**
 * Main screening function - this is what gets called when a recruiter clicks "Screen Applicants"
 * 
 * It takes a job description and a list of candidates, sends them to Gemini for evaluation,
 * and returns a ranked shortlist with detailed explanations for each candidate.
 * 
 * The function is resilient - if one AI model fails, it tries the next one automatically.
 * We also add a 30-second timeout per model to prevent hanging indefinitely.
 * 
 * @param job - The job requirements (skills, experience level, responsibilities, etc)
 * @param candidates - Array of candidate profiles to evaluate
 * @param topN - How many top candidates to return (default 20)
 * @returns Ranked shortlist with scores, strengths, gaps, and recommendations
 */
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
      
      // Give each model 30 seconds max - if it's taking longer, move to the next one
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Model timeout after 30s')), 30000)
      );
      
      // Race the AI call against the timeout - whichever finishes first wins
      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      
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
