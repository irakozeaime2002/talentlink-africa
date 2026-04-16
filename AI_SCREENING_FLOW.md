# AI Screening Flow - Complete Documentation

## Overview
TalentLink Africa uses a **hybrid approach** for candidate screening:
- **Deterministic scoring** (server-side) → Consistent, repeatable scores
- **AI insights** (Gemini) → Qualitative analysis with specific evidence

---

## Step-by-Step Flow

### Step 1: Data Collection (Multiple Sources)

**Candidate data comes from:**
1. **Structured profiles** - Manual entry via forms
2. **CSV imports** - Bulk uploads with flexible column names
3. **PDF resumes** - Unstructured text extraction
4. **Job applications** - Applicant submissions with cover letters

**All data is stored in candidate object:**
```javascript
{
  // Structured fields
  skills: [{name: "Python", level: "Advanced"}],
  experience: [{company: "TechCorp", role: "Engineer", startDate: "2020-01", endDate: "2024-01"}],
  projects: [{name: "AI System", technologies: ["Node.js", "Gemini"]}],
  education: [{institution: "MIT", degree: "Bachelor's", fieldOfStudy: "Computer Science"}],
  certifications: [{name: "AWS Certified Developer"}],
  
  // Text fields (CRITICAL for CSV/PDF)
  bio: "[CSV Import - All Fields]\nname: John Doe\nskills: Python, Java\nexperience: 5 years...",
  cv_text: "Full resume text from PDF upload (up to 10,000 chars)...",
  cover_letter: "Applicant's cover letter text...",
  headline: "Senior Backend Engineer - Node.js & AI",
  
  // Application data
  application_answers: [{question: "Why this role?", answer: "..."}],
  attached_documents: "CV.pdf, Certificate.pdf"
}
```

---

### Step 2: Deterministic Scoring (Server-Side)

**Scores are calculated using pure algorithmic logic - NO AI involved.**

#### Skills Score (40% weight)
```javascript
// Multi-source search
1. Check skills[] array
2. Search bio field for job-required skills
3. Search cv_text for job-required skills
4. Search experience[].description for skills

// Calculation
base = (matched_skills / required_skills) × 100
+ preferred_skills_bonus (max +20)
+ advanced/expert_bonus (max +10)
= Final skills score (0-100)
```

**Example:**
- Job requires: Python, AWS, Docker
- Candidate has: Python (in skills[]), AWS (found in cv_text), Docker (missing)
- Score: 2/3 = 66.67 + bonuses

#### Experience Score (30% weight)
```javascript
// Multi-source extraction
1. Calculate years from experience[] array (with dates)
2. Extract from bio: "5 years", "since 2020", "3+ years"
3. Extract from cv_text: same patterns
4. Extract from experience[].description

// Calculation
totalYears → map to seniority level (none/low/mid/high)
→ lookup in matrix[job_level][candidate_level]
= Final experience score (0-100)
```

**Matrix Example:**
- Job level: Senior
- Candidate: 5 years (mid-level)
- Score: matrix["Senior"]["mid"] = 90

#### Projects Score (20% weight)
```javascript
// Multi-source detection
1. Count projects[] with relevant technologies
2. Check bio for project keywords (built, developed, github)
3. Check cv_text for project keywords

// Calculation
0 relevant projects = 10
1 relevant project = 50
2 relevant projects = 70
3+ relevant projects = 85
+ multi-skill bonus (max +15)
= Final projects score (0-100)
```

#### Education Score (10% weight)
```javascript
// Multi-source detection
1. Check education[] for relevant degrees
2. Check bio for education keywords (degree, university, graduated)
3. Check cv_text for education keywords

// Calculation
No education = 25
Unrelated degree = 35
Related degree = 75
Related + certifications = 85-95
= Final education score (0-100)
```

#### Final Match Score
```javascript
match_score = (skills × 0.4) + (experience × 0.3) + (projects × 0.2) + (education × 0.1)
+ tiebreaker (0-0.099 based on candidate_id hash)
= Final score (0-100)
```

**Recommendation Label:**
- 80-100: Strongly Recommend
- 60-79: Recommend
- 40-59: Consider
- 0-39: Do Not Recommend

---

### Step 3: AI Insights (Gemini)

**Gemini receives:**
- Full job requirements (title, description, required_skills, preferred_skills, etc.)
- Full candidate profiles (ALL fields: structured + bio + cv_text + cover_letter)

**Gemini's instructions:**
1. ✅ Read EVERY field for EVERY candidate
2. ✅ Search bio and cv_text for additional information
3. ✅ Cross-reference: if skills[] is empty, look in bio/cv_text
4. ✅ Provide SPECIFIC evidence: exact skill names, company names, years
5. ❌ Do NOT calculate scores (server handles this)
6. ❌ Do NOT use vague language ("good fit", "strong candidate")

**Gemini provides for each candidate:**

```javascript
{
  strengths: [
    "5 years Node.js experience at Microsoft (2019-2024)",
    "Built AI recruitment system using Gemini API and Next.js",
    "Bachelor's in Computer Science from MIT with AWS certification"
  ],
  gaps: [
    "Missing required skill: Docker",
    "No experience with microservices architecture"
  ],
  reason: "Strong mid-level candidate with 5 years relevant backend experience. Node.js and AWS skills match requirements perfectly, demonstrated through 3 production projects. Main gap is missing Docker experience which is required for this role."
}
```

---

### Step 4: Combine Results

**Server combines:**
- Deterministic scores (from Step 2)
- AI insights (from Step 3)

**Final output per candidate:**
```javascript
{
  rank: 1,
  candidate_id: "507f1f77bcf86cd799439011",
  name: "John Doe",
  match_score: 76.17,  // ← Deterministic (always same)
  score_breakdown: {
    skills: 66.67,      // ← Deterministic
    experience: 90,     // ← Deterministic
    projects: 85,       // ← Deterministic
    education: 75       // ← Deterministic
  },
  strengths: [...],    // ← From Gemini (specific evidence)
  gaps: [...],         // ← From Gemini (specific missing items)
  reason: "...",       // ← From Gemini (narrative explanation)
  recommendation: "Recommend"  // ← Derived from score
}
```

---

## Key Features

### ✅ Deterministic Scoring
- Same candidate = same score every time
- No Gemini randomness in scores
- Transparent, explainable formula

### ✅ Multi-Source Data Reading
- Structured fields (skills[], experience[], etc.)
- Bio field (CSV data backup)
- CV text (PDF resume content)
- Cover letter (applicant's pitch)
- Experience descriptions (legacy PDF storage)

### ✅ Flexible CSV Handling
- Recognizes 50+ column name variations
- Supports Umurava schema ("Start Date", "Field of Study")
- Supports camelCase (startDate, fieldOfStudy)
- Falls back to bio field for unrecognized columns

### ✅ AI-Powered Insights
- Gemini reads ALL fields (not just structured data)
- Provides specific evidence (not vague statements)
- Cross-references multiple data sources
- Explains fit with concrete examples

### ✅ Consistent Results
- Scores: 100% deterministic
- Insights: Specific and evidence-based
- Rankings: Based on objective scores
- Recommendations: Derived from score thresholds

---

## Example Screening Run

**Job Requirements:**
- Title: Senior Backend Engineer
- Required Skills: Node.js, PostgreSQL, Docker
- Preferred Skills: AWS, Kubernetes
- Experience Level: Senior

**Candidate 1: CSV Import**
```csv
name,email,skills,years_of_experience,education
John Doe,john@email.com,Node.js;PostgreSQL;AWS,5,Computer Science
```

**Stored as:**
```javascript
{
  name: "John Doe",
  skills: [{name: "Node.js"}, {name: "PostgreSQL"}, {name: "AWS"}],
  experience: [],
  bio: "name: John Doe\nemail: john@email.com\nskills: Node.js;PostgreSQL;AWS\nyears_of_experience: 5\neducation: Computer Science"
}
```

**Deterministic Scoring:**
- Skills: Node.js ✓, PostgreSQL ✓, Docker ✗ = 2/3 = 66.67 + AWS (preferred) +5 = 71.67
- Experience: "5" found in bio → mid-level → Senior job + mid = 90
- Projects: No projects[] but bio doesn't mention projects = 10
- Education: "Computer Science" found in bio = 75
- **Final: (71.67×0.4) + (90×0.3) + (10×0.2) + (75×0.1) = 66.17**

**AI Insights:**
- Strengths: "5 years experience with Node.js and PostgreSQL", "AWS experience (preferred skill)", "Computer Science education"
- Gaps: "Missing required skill: Docker"
- Reason: "Mid-level candidate with 5 years relevant backend experience. Node.js and PostgreSQL skills match requirements. Missing Docker which is required."

---

**Candidate 2: PDF Resume**
```
John Smith
Senior Software Engineer

I have 8 years of experience building scalable backend systems with Node.js, PostgreSQL, and Docker.
Led 5 microservices projects at Amazon using AWS and Kubernetes.
Master's degree in Computer Science from Stanford.
```

**Stored as:**
```javascript
{
  name: "John Smith",
  skills: [],
  experience: [],
  cv_text: "John Smith\nSenior Software Engineer\n\nI have 8 years of experience building scalable backend systems with Node.js, PostgreSQL, and Docker.\nLed 5 microservices projects at Amazon using AWS and Kubernetes.\nMaster's degree in Computer Science from Stanford."
}
```

**Deterministic Scoring:**
- Skills: cv_text searched → Node.js ✓, PostgreSQL ✓, Docker ✓ = 3/3 = 100 + AWS ✓ +5 + Kubernetes ✓ +5 = 110 (capped at 100)
- Experience: "8 years" found in cv_text → high-level → Senior job + high = 80
- Projects: "5 microservices projects" found in cv_text = 85
- Education: "Master's degree in Computer Science" found in cv_text = 95
- **Final: (100×0.4) + (80×0.3) + (85×0.2) + (95×0.1) = 80.5**

**AI Insights:**
- Strengths: "8 years backend experience with Node.js, PostgreSQL, and Docker at Amazon", "Led 5 microservices projects using AWS and Kubernetes", "Master's in Computer Science from Stanford"
- Gaps: []
- Reason: "Excellent senior-level candidate with 8 years relevant experience. All required skills present (Node.js, PostgreSQL, Docker) plus both preferred skills (AWS, Kubernetes). Strong project portfolio and advanced education."

---

## Result

**Ranking:**
1. John Smith - 80.5 (Strongly Recommend)
2. John Doe - 66.17 (Recommend)

**Both candidates scored consistently:**
- ✅ Same data = same score (deterministic)
- ✅ All fields read (structured + bio + cv_text)
- ✅ Specific insights (company names, years, skills)
- ✅ Clear gaps identified (Docker missing for Candidate 1)

---

## Summary

**Deterministic Scoring ensures:**
- Consistency across multiple runs
- Transparency in how scores are calculated
- No AI randomness affecting rankings

**AI Insights provide:**
- Human-readable explanations
- Specific evidence from profiles
- Context-aware reasoning
- Gap identification

**Together they deliver:**
- Fair, objective candidate evaluation
- Explainable AI decisions
- Recruiter-friendly output
- Trust in the system
