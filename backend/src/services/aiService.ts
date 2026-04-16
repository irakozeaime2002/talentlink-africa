import { GoogleGenerativeAI } from "@google/generative-ai";
import { JobInput, CandidateInput, ScreeningOutput } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-3-flash-preview",
  "gemini-2.0-flash-lite",
];

/**
 * OPTIMIZED DETERMINISTIC SCORING ENGINE
 * 
 * Calculate all scores server-side using pure algorithmic logic.
 * Gemini is ONLY used for qualitative analysis (strengths, gaps, reasoning).
 * This guarantees 100% consistent scores across multiple runs.
 * 
 * OPTIMIZATION STRATEGY:
 * 1. Focus on EXACT job requirements only (don't analyze irrelevant fields)
 * 2. Early exit when requirements are met (skip unnecessary checks)
 * 3. Cache extracted data to avoid re-parsing same text multiple times
 * 4. Use structured fields first, fallback to text parsing only if needed
 * 
 * For CSV imports: We use a FLEXIBLE approach:
 * 1. Check structured fields first (skills[], experience[], etc.)
 * 2. If empty/minimal, scan bio/cv_text for relevant keywords
 * 3. Match job requirements against ALL text content (case-insensitive, fuzzy)
 * 
 * This handles ANY CSV format - even if column names are completely different.
 */

/**
 * Extract skills from ANY text field by searching for job-required skills
 * Uses flexible matching - not just exact matches
 * This searches for BOTH technical skills AND soft skills (communication, teamwork, etc.)
 */
const extractSkillsFromBio = (bio: string, requiredSkills: string[], preferredSkills: string[]): Array<{name: string}> => {
  const bioLower = bio.toLowerCase();
  const foundSkills: Array<{name: string}> = [];
  
  // Search for each required/preferred skill with flexible matching
  [...requiredSkills, ...preferredSkills].forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    // Direct match
    if (bioLower.includes(skillLower)) {
      foundSkills.push({ name: skill });
      return;
    }
    
    // Flexible matching for common variations
    const variations = getSkillVariations(skillLower);
    if (variations.some(v => bioLower.includes(v))) {
      foundSkills.push({ name: skill });
    }
  });
  
  return foundSkills;
};

/**
 * Get common variations of a skill name for flexible matching
 * Includes technical skills, soft skills, and language skills
 */
const getSkillVariations = (skill: string): string[] => {
  const variations: string[] = [skill];
  
  // SEMANTIC MATCHING: Map skills to their meanings and related terms
  const skillMap: Record<string, string[]> = {
    // Technical skills
    'javascript': ['js', 'javascript', 'java script', 'ecmascript'],
    'typescript': ['ts', 'typescript', 'type script'],
    'python': ['python', 'py'],
    'node.js': ['node', 'nodejs', 'node.js', 'node js'],
    'react': ['react', 'reactjs', 'react.js', 'react js'],
    'vue': ['vue', 'vuejs', 'vue.js', 'vue js'],
    'angular': ['angular', 'angularjs', 'angular.js'],
    'next.js': ['next', 'nextjs', 'next.js', 'next js'],
    'express': ['express', 'expressjs', 'express.js'],
    'mongodb': ['mongo', 'mongodb', 'mongo db'],
    'postgresql': ['postgres', 'postgresql', 'postgre sql', 'psql'],
    'mysql': ['mysql', 'my sql'],
    'docker': ['docker', 'containerization', 'containers'],
    'kubernetes': ['k8s', 'kubernetes', 'kube'],
    'aws': ['aws', 'amazon web services', 'amazon cloud'],
    'azure': ['azure', 'microsoft azure'],
    'gcp': ['gcp', 'google cloud', 'google cloud platform'],
    'git': ['git', 'github', 'gitlab', 'version control'],
    'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
    'rest api': ['rest', 'restful', 'rest api', 'api'],
    'graphql': ['graphql', 'graph ql', 'gql'],
    'machine learning': ['ml', 'machine learning', 'ai', 'artificial intelligence'],
    'deep learning': ['deep learning', 'neural network', 'dl'],
    
    // SOFT SKILLS - SEMANTIC MATCHING (meaning-based)
    'customer service': ['customer service', 'customer support', 'client service', 'customer care', 'serving customers', 'serve customers', 'helping customers', 'assist customers', 'customer satisfaction', 'client relations', 'customer experience'],
    'customer service skills': ['customer service', 'customer support', 'client service', 'customer care', 'serving customers', 'serve customers', 'helping customers', 'assist customers', 'customer satisfaction', 'client relations', 'customer experience'],
    'communication': ['communication', 'communicating', 'interpersonal', 'verbal', 'written communication', 'speaking', 'talking', 'listening', 'express', 'convey'],
    'communication skills': ['communication', 'communicating', 'interpersonal', 'verbal', 'written communication', 'speaking', 'talking', 'listening', 'express', 'convey', 'interact', 'dialogue'],
    'good communication': ['communication', 'communicating', 'interpersonal', 'good communication', 'excellent communication', 'strong communication', 'effective communication', 'clear communication', 'speaking', 'talking', 'listening'],
    'good communication skills': ['communication', 'communicating', 'interpersonal', 'good communication', 'excellent communication', 'strong communication', 'effective communication', 'clear communication', 'speaking', 'talking', 'listening', 'interact'],
    'teamwork': ['teamwork', 'team work', 'collaboration', 'team player', 'collaborative', 'work in a team', 'work with team', 'team member', 'cooperate', 'cooperation', 'working together', 'group work'],
    'ability to work in a team': ['teamwork', 'team work', 'collaboration', 'team player', 'collaborative', 'work in a team', 'work with team', 'team member', 'cooperate', 'cooperation', 'working together', 'group work', 'team environment'],
    'work in a team': ['teamwork', 'team work', 'collaboration', 'team player', 'collaborative', 'work in a team', 'work with team', 'team member', 'cooperate', 'cooperation', 'working together'],
    'leadership': ['leadership', 'leading', 'management', 'managing', 'lead', 'manager', 'supervisor', 'coordinate', 'direct', 'guide'],
    'time management': ['time management', 'punctual', 'punctuality', 'organized', 'organization', 'managing time', 'deadline', 'efficient', 'productivity', 'prioritize', 'scheduling'],
    'problem solving': ['problem solving', 'problem-solving', 'analytical', 'critical thinking', 'troubleshoot', 'resolve issues', 'find solutions'],
    'adaptability': ['adaptability', 'flexible', 'flexibility', 'adapt', 'versatile', 'adjust', 'change'],
    'attention to detail': ['attention to detail', 'detail-oriented', 'meticulous', 'thorough', 'careful', 'precise', 'accuracy'],
    'multitasking': ['multitasking', 'multi-tasking', 'handle multiple', 'juggle', 'manage multiple'],
    
    // HOSPITALITY & SERVICE SKILLS
    'restaurant experience': ['restaurant', 'café', 'cafe', 'dining', 'food service', 'hospitality', 'waiter', 'waitress', 'server', 'serving'],
    'previous experience in a restaurant': ['restaurant', 'café', 'cafe', 'dining', 'food service', 'hospitality', 'waiter', 'waitress', 'server', 'serving', 'worked at restaurant'],
    'café experience': ['café', 'cafe', 'coffee shop', 'restaurant', 'food service', 'barista'],
    'knowledge of food': ['food knowledge', 'menu', 'dishes', 'cuisine', 'ingredients', 'recipes', 'culinary'],
    'knowledge of beverages': ['beverages', 'drinks', 'coffee', 'tea', 'cocktails', 'bar', 'barista'],
    'knowledge of food and beverages': ['food', 'beverages', 'drinks', 'menu', 'dishes', 'cuisine', 'coffee', 'tea', 'culinary'],
    'handle busy environments': ['busy', 'fast-paced', 'high-volume', 'rush', 'pressure', 'stressful', 'hectic', 'multitask'],
    'busy environments': ['busy', 'fast-paced', 'high-volume', 'rush', 'pressure', 'stressful', 'hectic'],
    'friendly': ['friendly', 'warm', 'welcoming', 'pleasant', 'approachable', 'courteous', 'polite'],
    'professional attitude': ['professional', 'professionalism', 'courteous', 'respectful', 'reliable', 'responsible'],
    'friendly and professional': ['friendly', 'professional', 'warm', 'welcoming', 'courteous', 'polite', 'respectful'],
    
    // LANGUAGES (CRITICAL: Check languages[] field)
    'english': ['english', 'anglais'],
    'basic english': ['english', 'anglais', 'basic english', 'conversational english'],
    'french': ['french', 'français', 'francais'],
    'kinyarwanda': ['kinyarwanda', 'ikinyarwanda', 'rwanda', 'rwandan'],
    'swahili': ['swahili', 'kiswahili'],
    'spanish': ['spanish', 'español', 'espanol'],
    'german': ['german', 'deutsch'],
    'chinese': ['chinese', 'mandarin'],
    'arabic': ['arabic'],
  };
  
  // Check if skill has known variations
  for (const [key, vars] of Object.entries(skillMap)) {
    if (skill.includes(key) || vars.some(v => skill.includes(v))) {
      variations.push(...vars);
      break;
    }
  }
  
  // Add common variations for any skill
  variations.push(
    skill.replace(/\./g, ''),        // Remove dots: node.js → nodejs
    skill.replace(/\s+/g, ''),       // Remove spaces: node js → nodejs
    skill.replace(/-/g, ''),         // Remove hyphens: next-js → nextjs
    skill.replace(/js$/i, ''),       // Remove js suffix: reactjs → react
    skill.replace(/skills?$/i, ''),  // Remove "skill(s)" suffix: communication skills → communication
    skill.replace(/^good\s+/i, ''),  // Remove "good" prefix: good communication → communication
    skill.replace(/^excellent\s+/i, ''), // Remove "excellent" prefix
    skill.replace(/^strong\s+/i, ''),    // Remove "strong" prefix
    skill.replace(/^ability to\s+/i, ''), // Remove "ability to" prefix: ability to work → work
    skill.replace(/^knowledge of\s+/i, ''), // Remove "knowledge of" prefix
    skill.replace(/^previous experience in\s+/i, ''), // Remove "previous experience in" prefix
  );
  
  return [...new Set(variations)]; // Remove duplicates
};

/**
 * Extract years of experience from bio by looking for ANY number patterns
 */
const extractYearsFromBio = (bio: string): number => {
  const bioLower = bio.toLowerCase();
  
  // Look for patterns like:
  // "5 years", "3+ years", "experience: 2", "yoe: 4", "2-3 years", "since 2020"
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?|y)\s*(?:of\s*)?(?:experience)?/i,
    /(?:experience|yoe|years)\s*:?\s*(\d+)/i,
    /(\d+)\s*(?:years?|yrs?)\s*(?:experience)?/i,
    /since\s*(\d{4})/i, // "since 2020" → calculate years
  ];
  
  for (const pattern of patterns) {
    const match = bio.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      // If it's a year (like 2020), calculate years from now
      if (num > 1900 && num < 2100) {
        return new Date().getFullYear() - num;
      }
      return num;
    }
  }
  
  return 0;
};

/**
 * Check if bio mentions any education/degree keywords
 */
const hasEducationInBio = (bio: string): boolean => {
  const bioLower = bio.toLowerCase();
  const eduKeywords = [
    'degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate',
    'university', 'college', 'school', 'education', 'graduated',
    'bsc', 'msc', 'ba', 'ma', 'bs', 'ms'
  ];
  
  return eduKeywords.some(keyword => bioLower.includes(keyword));
};

/**
 * Check if bio mentions any project/portfolio keywords
 */
const hasProjectsInBio = (bio: string): boolean => {
  const bioLower = bio.toLowerCase();
  const projectKeywords = [
    'project', 'portfolio', 'built', 'developed', 'created',
    'github', 'deployed', 'implemented', 'designed'
  ];
  
  return projectKeywords.some(keyword => bioLower.includes(keyword));
};

/**
 * Evaluate document quality - checks if required documents are present and valid
 */
const calculateDocumentScore = (candidate: CandidateInput, job: JobInput): number => {
  const requiredDocs = job.required_documents || [];
  
  // OPTIMIZATION: Early exit if no documents required
  if (requiredDocs.length === 0) return 100;
  
  const attachedDocs = candidate.attached_documents || '';
  
  // OPTIMIZATION: Early exit if no documents attached
  if (!attachedDocs) return Math.max(0, 100 - (requiredDocs.length * 20));
  
  const attachedDocsLower = attachedDocs.toLowerCase();
  
  let score = 100;
  
  // OPTIMIZATION: Check each required document exactly once
  for (const docType of requiredDocs) {
    const docLower = docType.toLowerCase();
    
    // Check if document type is mentioned in attached_documents
    const isPresent = attachedDocsLower.includes(docLower) ||
                      attachedDocsLower.includes(docLower.replace(/\s+/g, '')) ||
                      (docLower.includes('cv') && (attachedDocsLower.includes('resume') || attachedDocsLower.includes('cv'))) ||
                      (docLower.includes('resume') && (attachedDocsLower.includes('cv') || attachedDocsLower.includes('resume')));
    
    if (!isPresent) {
      score -= 20; // -20 points per missing document
    }
  }
  
  return Math.max(0, score);
};

/**
 * Evaluate application answers quality - checks completeness and depth
 */
const calculateAnswersScore = (candidate: CandidateInput, job: JobInput): number => {
  const questions = job.application_questions || [];
  const answers = candidate.application_answers || [];
  
  // OPTIMIZATION: Early exit if no questions required
  if (questions.length === 0) return 100;
  
  // OPTIMIZATION: Early exit if no answers provided
  if (answers.length === 0) return 0;
  
  // Check if all questions were answered
  const answeredCount = answers.filter(a => a.answer && a.answer.trim().length > 0).length;
  
  if (answeredCount === 0) return 0;
  
  // Base score from answer rate
  let score = (answeredCount / questions.length) * 100;
  
  // Quality bonus: check answer depth (OPTIMIZATION: single pass)
  for (const a of answers) {
    const answerLength = (a.answer || '').trim().length;
    
    if (answerLength > 200) {
      score += 5; // Detailed answer bonus
    } else if (answerLength < 50 && answerLength > 0) {
      score -= 10; // Too short penalty
    }
  }
  
  return Math.min(100, Math.max(0, score));
};

/**
 * INTELLIGENT SKILL MATCHING - Searches EVERYWHERE in candidate profile
 * Checks: skills[], languages[], bio, cv_text, cover_letter, application_answers[], 
 *         headline, experience[], projects[], AND all uploaded document content
 * Matches both technical skills AND soft skills (communication, teamwork, etc.)
 * Matches language requirements (English, French, Kinyarwanda, etc.)
 */
const calculateSkillsScore = (candidate: CandidateInput, job: JobInput): number => {
  const requiredSkills = (job.required_skills || []).map(s => (s || '').toLowerCase()).filter(s => s);
  const preferredSkills = (job.preferred_skills || []).map(s => (s || '').toLowerCase()).filter(s => s);
  
  if (requiredSkills.length === 0) return 50;
  
  // INTELLIGENT SEARCH: Collect skills from ALL possible sources
  const skillsSet = new Set<string>();
  const skillLevels = new Map<string, string>();
  
  // Source 1: Structured skills[] array
  const structuredSkills = candidate.skills || [];
  structuredSkills.forEach(s => {
    const name = (s.name || '').toLowerCase();
    if (name) {
      skillsSet.add(name);
      skillLevels.set(name, s.level || 'Beginner');
    }
  });
  
  // Source 2: Languages[] array (CRITICAL for language requirements like "English", "Kinyarwanda")
  // This is the PRIMARY source for language skills - check this FIRST
  const languages = candidate.languages || [];
  languages.forEach(lang => {
    const name = (lang.name || '').toLowerCase();
    if (name) {
      skillsSet.add(name);
      // Map language proficiency to skill level
      const proficiency = lang.proficiency || 'Basic';
      const level = proficiency === 'Native' || proficiency === 'Fluent' ? 'Expert' :
                    proficiency === 'Conversational' ? 'Intermediate' : 'Beginner';
      skillLevels.set(name, level);
      
      // Also add common variations for better matching
      const variations = getSkillVariations(name);
      variations.forEach(v => {
        if (v) {
          skillsSet.add(v);
          skillLevels.set(v, level);
        }
      });
      
      // CRITICAL: Also add the language with proficiency prefix for compound requirements
      // e.g., "Basic English" should match if languages[] has {name: "English", proficiency: "Basic"}
      skillsSet.add(`${proficiency.toLowerCase()} ${name}`);
      skillsSet.add(`${name} ${proficiency.toLowerCase()}`);
    }
  });
  
  // Source 3: Bio field (may contain everything from CSV)
  if (candidate.bio) {
    const bioSkills = extractSkillsFromBio(candidate.bio, requiredSkills, preferredSkills);
    bioSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
  }
  
  // Source 4: CV text (full resume content from uploaded PDF/DOCX)
  if (candidate.cv_text) {
    const cvSkills = extractSkillsFromBio(candidate.cv_text, requiredSkills, preferredSkills);
    cvSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
  }
  
  // Source 5: Cover letter (uploaded document or text field)
  if (candidate.cover_letter) {
    const coverSkills = extractSkillsFromBio(candidate.cover_letter, requiredSkills, preferredSkills);
    coverSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
  }
  
  // Source 6: Application answers (custom question responses)
  if (candidate.application_answers) {
    const allAnswers = candidate.application_answers.map(a => a.answer || '').join(' ');
    if (allAnswers) {
      const answerSkills = extractSkillsFromBio(allAnswers, requiredSkills, preferredSkills);
      answerSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
    }
  }
  
  // Source 7: Headline (professional summary)
  if (candidate.headline) {
    const headlineSkills = extractSkillsFromBio(candidate.headline, requiredSkills, preferredSkills);
    headlineSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
  }
  
  // Source 8: Experience descriptions
  const experiences = candidate.experience || [];
  for (const exp of experiences) {
    // Check role title
    if (exp.role) {
      const roleSkills = extractSkillsFromBio(exp.role, requiredSkills, preferredSkills);
      roleSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
    }
    // Check description
    if (exp.description) {
      const expSkills = extractSkillsFromBio(exp.description, requiredSkills, preferredSkills);
      expSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
    }
    // Check technologies
    if (exp.technologies) {
      exp.technologies.forEach(tech => {
        if (tech) skillsSet.add(tech.toLowerCase());
      });
    }
  }
  
  // Source 9: Projects (technologies and descriptions)
  const projects = candidate.projects || [];
  for (const proj of projects) {
    if (proj.description) {
      const projSkills = extractSkillsFromBio(proj.description, requiredSkills, preferredSkills);
      projSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
    }
    if (proj.technologies) {
      proj.technologies.forEach(tech => {
        if (tech) skillsSet.add(tech.toLowerCase());
      });
    }
  }
  
  // Source 10: Certifications (may contain skill names)
  const certifications = candidate.certifications || [];
  for (const cert of certifications) {
    if (cert.name) {
      const certSkills = extractSkillsFromBio(cert.name, requiredSkills, preferredSkills);
      certSkills.forEach(skill => skillsSet.add(skill.name.toLowerCase()));
    }
  }
  
  // Convert Set to array for matching
  const allSkills = Array.from(skillsSet);
  
  // INTELLIGENT MATCHING: Use flexible matching with variations
  const matched = requiredSkills.filter(req => {
    // Handle compound requirements like "Basic English (and Kinyarwanda)"
    // Split by common separators: "and", "or", ",", "(", ")"
    const parts = req.split(/\s+(?:and|or|,|\(|\))\s+/).map(p => p.trim().toLowerCase()).filter(p => p);
    
    // If requirement has multiple parts (e.g., "Basic English" and "Kinyarwanda"),
    // check if ALL parts are found
    if (parts.length > 1) {
      const allPartsFound = parts.every(part => {
        // Direct match
        if (allSkills.some(cs => cs.includes(part) || part.includes(cs))) {
          return true;
        }
        // Check variations
        const variations = getSkillVariations(part);
        return allSkills.some(cs => variations.some(v => cs.includes(v) || v.includes(cs)));
      });
      
      if (allPartsFound) return true;
    }
    
    // Direct match for single requirement
    if (allSkills.some(cs => cs.includes(req) || req.includes(cs))) {
      return true;
    }
    
    // Check variations (e.g., "english" matches "anglais", "communication" matches "good communication")
    const variations = getSkillVariations(req);
    const found = allSkills.some(cs => variations.some(v => cs.includes(v) || v.includes(cs)));
    
    // Debug logging for language skills
    if (!found && (req.includes('english') || req.includes('french') || req.includes('kinyarwanda') || req.includes('language'))) {
      console.log(`[Skills] Language requirement "${req}" not found.`);
      console.log(`[Skills] Candidate languages[] field:`, languages.map(l => `${l.name} (${l.proficiency || 'N/A'})`));
      console.log(`[Skills] All skills in skillsSet:`, Array.from(allSkills).filter(s => 
        s.includes('english') || s.includes('french') || s.includes('kinyarwanda') || 
        s.includes('language') || s.includes('anglais')
      ));
    }
    
    return found;
  });
  
  // Calculate base score from required skills match
  const baseScore = (matched.length / requiredSkills.length) * 100;
  
  // Debug logging for skill matching
  console.log(`[Skills] Candidate: ${candidate.name}`);
  console.log(`[Skills] Required: ${requiredSkills.length}, Matched: ${matched.length}`);
  console.log(`[Skills] Matched skills:`, matched);
  const missing = requiredSkills.filter(req => !matched.includes(req));
  if (missing.length > 0) {
    console.log(`[Skills] Missing skills:`, missing);
  }
  
  // CRITICAL: Bonuses should only apply if ALL required skills are met
  // If any required skill is missing, cap the score at the base percentage
  if (matched.length < requiredSkills.length) {
    // Missing required skills - no bonuses allowed
    // Cap at 95% to ensure perfect match (100%) is only for candidates with ALL requirements
    console.log(`[Skills] Score capped at ${Math.min(95, baseScore)}% due to missing required skills`);
    return Math.min(95, Math.max(0, baseScore));
  }
  
  // All required skills matched - now add bonuses
  let score = baseScore;
  
  // Preferred skills bonus (+5 each, max +20)
  const preferredMatched = preferredSkills.filter(pref => {
    if (allSkills.some(cs => cs.includes(pref) || pref.includes(cs))) {
      return true;
    }
    const variations = getSkillVariations(pref);
    return allSkills.some(cs => variations.some(v => cs.includes(v) || v.includes(cs)));
  });
  const preferredBonus = Math.min(20, preferredMatched.length * 5);
  score += preferredBonus;
  
  // Advanced/Expert bonus (+2 each, max +10)
  const advancedCount = Array.from(skillLevels.values()).filter(level => 
    level === 'Advanced' || level === 'Expert'
  ).length;
  const expertBonus = Math.min(10, advancedCount * 2);
  score += expertBonus;
  
  console.log(`[Skills] Final score: ${Math.min(100, score)}% (base: ${baseScore}%, preferred: +${preferredBonus}%, expert: +${expertBonus}%)`);
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Helper to get field value supporting both camelCase and "Spaced Names" (Umurava schema)
 */
const getField = (obj: any, camelCase: string, spacedName: string): any => {
  return obj[camelCase] || obj[spacedName];
};

const calculateExperienceScore = (candidate: CandidateInput, job: JobInput): number => {
  let totalYears = 0;
  
  // Source 1: Structured experience[] array
  const experiences = candidate.experience || [];
  experiences.forEach(exp => {
    // Support both camelCase and Umurava schema field names
    const startDate = getField(exp, 'startDate', 'Start Date') || "2020-01-01";
    const endDate = getField(exp, 'endDate', 'End Date') || "2020-01-01";
    const isCurrent = getField(exp, 'isCurrent', 'Is Current') || false;
    
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : new Date(endDate);
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    totalYears += Math.max(0, years);
  });
  
  // Source 2: Bio field (CSV data) - extract years from text
  if (totalYears === 0 && candidate.bio) {
    totalYears = extractYearsFromBio(candidate.bio);
  }
  
  // Source 3: CV text - extract years from text
  if (totalYears === 0 && candidate.cv_text) {
    totalYears = extractYearsFromBio(candidate.cv_text);
  }
  
  // Source 4: Experience descriptions (for old PDF resumes)
  if (totalYears === 0) {
    const experiences = candidate.experience || [];
    experiences.forEach(exp => {
      if (exp.description) {
        const years = extractYearsFromBio(exp.description);
        if (years > 0) {
          totalYears = Math.max(totalYears, years);
        }
      }
    });
  }
  
  const matrix: Record<string, Record<string, number>> = {
    "Entry": { none: 30, low: 70, mid: 60, high: 50 },
    "Mid": { none: 10, low: 75, mid: 75, high: 65 },
    "Senior": { none: 0, low: 55, mid: 85, high: 80 },
    "Lead": { none: 0, low: 25, mid: 75, high: 90 },
    "Executive": { none: 0, low: 10, mid: 50, high: 90 }
  };
  
  const jobLevel = job.experience_level || "Entry";
  let candidateLevel = "none";
  if (totalYears >= 6) candidateLevel = "high";
  else if (totalYears >= 2) candidateLevel = "mid";
  else if (totalYears > 0) candidateLevel = "low";
  
  return matrix[jobLevel]?.[candidateLevel] || 50;
};

const calculateProjectsScore = (candidate: CandidateInput, job: JobInput): number => {
  const requiredSkills = (job.required_skills || []).map(s => (s || '').toLowerCase()).filter(s => s);
  
  // Source 1: Structured projects[] array
  const projects = candidate.projects || [];
  const relevantProjects = projects.filter(proj => {
    const techs = (proj.technologies || []).map(t => (t || '').toLowerCase());
    const desc = (proj.description || '').toLowerCase();
    return requiredSkills.some(skill => 
      techs.some(t => t && (t.includes(skill) || skill.includes(t))) ||
      desc.includes(skill)
    );
  });
  
  let relevantCount = relevantProjects.length;
  
  // Source 2: Bio field - check if mentions projects/portfolio
  if (relevantCount === 0 && candidate.bio && hasProjectsInBio(candidate.bio)) {
    // Give partial credit if bio mentions project keywords
    relevantCount = 1;
  }
  
  // Source 3: CV text - check if mentions projects/portfolio
  if (relevantCount === 0 && candidate.cv_text && hasProjectsInBio(candidate.cv_text)) {
    relevantCount = 1;
  }
  
  let score = relevantCount === 0 ? 10 :
              relevantCount === 1 ? 50 :
              relevantCount === 2 ? 70 : 85;
  
  // Bonus for projects with 2+ required skills (+5 each, max +15)
  const multiSkillProjects = relevantProjects.filter(proj => {
    const techs = (proj.technologies || []).map(t => (t || '').toLowerCase());
    const matchCount = requiredSkills.filter(skill =>
      techs.some(t => t && (t.includes(skill) || skill.includes(t)))
    ).length;
    return matchCount >= 2;
  });
  score += Math.min(15, multiSkillProjects.length * 5);
  
  return Math.min(100, Math.max(0, score));
};

const calculateEducationScore = (candidate: CandidateInput): number => {
  const education = candidate.education || [];
  const certifications = candidate.certifications || [];
  
  // Check structured education[] array
  let hasEducation = education.length > 0;
  let hasRelevant = false;
  
  if (hasEducation) {
    const relevantFields = ['computer', 'engineering', 'science', 'technology', 'business', 'management', 'hospitality', 'service'];
    hasRelevant = education.some(edu => {
      // Support both camelCase and Umurava schema field names
      const fieldOfStudy = getField(edu, 'fieldOfStudy', 'Field of Study') || "";
      const degree = getField(edu, 'degree', 'degree') || "";
      const field = fieldOfStudy.toLowerCase();
      const deg = degree.toLowerCase();
      return relevantFields.some(rf => field.includes(rf) || deg.includes(rf));
    });
  }
  
  // Source 2: Bio field - check if mentions education
  if (!hasEducation && candidate.bio && hasEducationInBio(candidate.bio)) {
    hasEducation = true;
    hasRelevant = true; // Assume relevant if mentioned
  }
  
  // Source 3: CV text - check if mentions education
  if (!hasEducation && candidate.cv_text && hasEducationInBio(candidate.cv_text)) {
    hasEducation = true;
    hasRelevant = true;
  }
  
  if (!hasEducation) return 25;
  
  let score = hasRelevant ? 75 : 35;
  
  if (certifications.length > 0) {
    score += Math.min(20, certifications.length * 5);
  }
  
  return Math.min(100, Math.max(0, score));
};

const calculateDeterministicScores = (candidate: CandidateInput, job: JobInput) => {
  // OPTIMIZATION: Check requirements once upfront
  const hasRequiredDocs = (job.required_documents || []).length > 0;
  const hasQuestions = (job.application_questions || []).length > 0;
  
  // OPTIMIZATION: Only calculate what's needed for this specific job
  const baseScores = {
    skills: calculateSkillsScore(candidate, job),
    experience: calculateExperienceScore(candidate, job),
    projects: calculateProjectsScore(candidate, job),
    education: calculateEducationScore(candidate),
    documents: hasRequiredDocs ? calculateDocumentScore(candidate, job) : undefined,
    answers: hasQuestions ? calculateAnswersScore(candidate, job) : undefined,
  };
  
  return baseScores;
};

const buildPrompt = (job: JobInput, candidates: CandidateInput[], topN: number): string => {
  // Pre-calculate what's actually required for this job
  const requiredSkills = (job.required_skills || []).filter(s => s);
  const preferredSkills = (job.preferred_skills || []).filter(s => s);
  const requiredDocs = (job.required_documents || []).filter(d => d);
  const questions = (job.application_questions || []).filter(q => q);
  
  // Build focused validation checklist
  const validationChecklist = [
    requiredSkills.length > 0 ? `REQUIRED SKILLS (${requiredSkills.length}): ${requiredSkills.join(', ')}` : null,
    preferredSkills.length > 0 ? `PREFERRED SKILLS (${preferredSkills.length}): ${preferredSkills.join(', ')}` : null,
    requiredDocs.length > 0 ? `REQUIRED DOCUMENTS (${requiredDocs.length}): ${requiredDocs.join(', ')}` : null,
    questions.length > 0 ? `APPLICATION QUESTIONS (${questions.length}): Must answer all` : null,
  ].filter(Boolean).join('\n');

  return `You are an AI recruitment analyst. Provide QUALITATIVE INSIGHTS ONLY.
All scores are calculated server-side - you do NOT calculate any scores.

## JOB: ${job.title}
**Experience Level:** ${job.experience_level || 'Entry'}

## EXACT REQUIREMENTS TO VERIFY:
${validationChecklist}

## CANDIDATES (${candidates.length} total)
${JSON.stringify(candidates, null, 2)}

## FOCUSED ANALYSIS INSTRUCTIONS

### EXAMPLE: How to check "Basic English (and Kinyarwanda)" requirement:
Step 1: Check candidate.languages[] array
  - If languages[] contains {name: "English", proficiency: "Conversational"} → English is FOUND
  - If languages[] contains {name: "Kinyarwanda", proficiency: "Native"} → Kinyarwanda is FOUND
  - Result: BOTH languages found in languages[] field → NO GAP

Step 2: Only if NOT in languages[], search text fields
  - Search bio, cv_text, cover_letter for "english", "anglais", "speak english"
  - Search for "kinyarwanda", "ikinyarwanda", "rwanda"

Step 3: Report in strengths
  - "Fluent English and Kinyarwanda (found in languages[] field)"

### PRIORITY 1: INTELLIGENT REQUIREMENT MATCHING
For EACH candidate, search EVERYWHERE in their profile to verify requirements:

${requiredSkills.length > 0 ? `✓ **Required Skills Check (SEMANTIC ANALYSIS - Search for MEANING, not exact words):**
   - Analyze the MEANING of each requirement, not just exact text match
   
   **CRITICAL: For LANGUAGE requirements (English, French, Kinyarwanda, etc.):**
   - FIRST check the languages[] array - this is the PRIMARY source for language skills
   - If a language is in languages[] with ANY proficiency (Basic, Conversational, Fluent, Native), mark it as FOUND
   - Example: Job needs "Basic English (and Kinyarwanda)" → Check if "English" AND "Kinyarwanda" are in languages[]
   - Only search text fields (bio, cv_text) if NOT found in languages[]
   - DO NOT mark language as missing if it exists in languages[] field
   
   **For SOFT SKILLS (communication, teamwork, customer service, time management):**
   - These are usually demonstrated through work experience, not listed as skills
   - Examples of semantic matching:
     • "Good communication skills" matches: "excellent at talking to customers", "strong interpersonal abilities", "effective communicator"
     • "Customer service skills" matches: "serving customers", "helping clients", "customer satisfaction", "worked as waiter"
     • "Ability to work in a team" matches: "team player", "collaborative", "work with colleagues", "team environment"
     • "Time management" matches: "punctual", "organized", "meet deadlines", "efficient"
   
   **For TECHNICAL SKILLS (Python, Docker, AWS, etc.):**
   - Check skills[], experience[].technologies[], projects[].technologies[], certifications[].name
   - Then search in bio, cv_text, experience descriptions
   
   - Search in ALL fields: skills[], languages[], bio, cv_text, cover_letter, application_answers[], experience[].description, projects[].description, certifications[].name, headline
   - IMPORTANT: Only list a skill as missing if the MEANING/CONCEPT is NOT found anywhere (not just the exact phrase)
   - Example: Job needs ["Python", "Docker", "AWS"] but candidate has only Python → gaps: ["Missing required skill: Docker", "Missing required skill: AWS"]` : ''}

${requiredDocs.length > 0 ? `✓ **Required Documents Check:**
   - Verify ALL ${requiredDocs.length} documents are in attached_documents field
   - List EVERY missing document in gaps[]
   - Example: Job needs "CV" and "Certificate" but only "CV.pdf" attached → gap: "Missing required document: Certificate"` : ''}

${questions.length > 0 ? `✓ **Application Answers Check:**
   - Verify candidate answered ALL ${questions.length} questions in application_answers[]
   - Flag vague answers (<50 chars) or missing answers
   - Example: Unanswered question → gap: "Did not answer: 'Why this role?'"` : ''}

### PRIORITY 2: STRENGTHS (Only if requirements met)
Reference SPECIFIC evidence from their profile with natural source attribution:
- Format: "[Evidence] (from [natural source description])"
- Examples:
  • "5 years Node.js experience at Microsoft as Senior Engineer (from work history)"
  • "Fluent in English and Kinyarwanda (from languages)"
  • "Customer service skills demonstrated through serving 50+ customers daily at Hope Restaurant (from experience)"
  • "Team collaboration experience working with 8-person development team (from project description)"
  • "Proven time management with consistent punctuality record (from cover letter)"
  • "AWS Certified Developer certification (from certifications)"
- Use natural source names: "from languages", "from work history", "from education", "from skills", "from certifications", "from cover letter", "from resume", "from bio"

### PRIORITY 3: REASON (2-3 sentences with context)
- Sentence 1: How many required skills matched vs total required
- Sentence 2: Best matching qualification with specific evidence
- Sentence 3: Main gap or concern (if any), or additional strength
- Example: "Matched 4 of 5 required skills. Strong customer service background with 3 years at Hope Restaurant serving customers daily. Missing required skill: Time management."

## EFFICIENCY RULES
✅ **DO:**
- **FOR LANGUAGES: ALWAYS check languages[] field FIRST before marking as missing**
- If "English" or "Kinyarwanda" or any language is in languages[] array, it is FOUND (regardless of proficiency level)
- Analyze the MEANING and CONTEXT of requirements, not just exact text matches
- Understand semantic equivalents: "serving customers" = "customer service", "team player" = "teamwork"
- Search EVERYWHERE: skills[], languages[], bio, cv_text, cover_letter, application_answers[], headline, experience[], projects[], certifications[]
- For languages: Check languages[] field first, then look for mentions in text ("speak English", "fluent in Kinyarwanda")
- For soft skills: Look for evidence in work descriptions ("managed team of 5" = leadership, "handled 50+ customers daily" = customer service)
- Use natural source attribution: "from languages", "from work history", "from education", "from skills", "from certifications", "from cover letter", "from resume"
- Be specific with evidence from their actual profile data
- Only mark as missing if the CONCEPT/MEANING is truly absent from ALL sources

❌ **DON'T:**
- Mark a language as missing if it exists in languages[] field
- Ignore the languages[] array when checking for language requirements
- Analyze everything if job only needs specific skills
- Use vague language: "good fit", "strong candidate"
- Mention scores or percentages
- Invent information not in profile

## JSON OUTPUT (no markdown, no code blocks):
{
  "job_summary": {
    "role": "${job.title}",
    "must_have_skills": ${JSON.stringify(requiredSkills)},
    "preferred_skills": ${JSON.stringify(preferredSkills)}
  },
  "ranking": [
    {
      "candidate_id": "<id>",
      "name": "<name>",
      "strengths": [
        "Specific evidence with natural source (from languages/skills/experience/etc)",
        "Another strength with source (from certifications)"
      ],
      "gaps": [
        "Missing required skill: X",
        "Missing document: Y"
      ],
      "reason": "Matched X of ${requiredSkills.length} required skills. [Best qualification]. [Main gap or additional strength]."
    }
  ]
}

Analyze ALL ${candidates.length} candidates focusing on SEMANTIC requirement matching with natural source attribution.`;
};;

const getRecommendation = (score: number): string =>
  score >= 80 ? "Strongly Recommend" :
  score >= 60 ? "Recommend" :
  score >= 40 ? "Consider" :
  "Do Not Recommend";

const parseOutput = (text: string, topN: number, candidatesMap: Map<string, CandidateInput>, job: JobInput): ScreeningOutput => {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(clean);
  
  const seenScores = new Set<number>();

  // Calculate deterministic scores for all candidates
  const scoredCandidates = parsed.ranking.map((c: any) => {
    const candidate = candidatesMap.get(c.candidate_id);
    if (!candidate) {
      console.warn(`[AI] Candidate ${c.candidate_id} not found in map`);
      return null;
    }

    // Calculate scores deterministically
    const score_breakdown = calculateDeterministicScores(candidate, job);
    
    // Calculate weighted score
    // If documents/answers are present, adjust weights:
    // Skills 30%, Experience 25%, Projects 15%, Education 10%, Documents 10%, Answers 10%
    // Otherwise: Skills 40%, Experience 30%, Projects 20%, Education 10%
    
    let computed: number;
    
    if (score_breakdown.documents !== undefined || score_breakdown.answers !== undefined) {
      // Adjusted weights when documents/answers are evaluated
      const docScore = score_breakdown.documents || 100;
      const ansScore = score_breakdown.answers || 100;
      
      computed = (
        (score_breakdown.skills * 0.30) +
        (score_breakdown.experience * 0.25) +
        (score_breakdown.projects * 0.15) +
        (score_breakdown.education * 0.10) +
        (docScore * 0.10) +
        (ansScore * 0.10)
      );
    } else {
      // Original weights when no documents/answers required
      computed = (
        (score_breakdown.skills * 0.4) +
        (score_breakdown.experience * 0.3) +
        (score_breakdown.projects * 0.2) +
        (score_breakdown.education * 0.1)
      );
    }

    // Add tiebreaker for uniqueness
    const idHash = (c.candidate_id || '').split('').reduce((acc: number, ch: string) => (acc * 31 + ch.charCodeAt(0)) & 0xffff, 0);
    const tiebreaker = (idHash % 100) / 1000;

    let adjusted = computed + tiebreaker;
    let rounded = Math.round(adjusted * 100) / 100;

    // Ensure no duplicate scores
    while (seenScores.has(rounded)) {
      rounded = Math.round((rounded + 0.01) * 100) / 100;
    }
    seenScores.add(rounded);

    return { 
      candidate_id: c.candidate_id,
      name: c.name,
      match_score: rounded,
      score_breakdown,
      strengths: c.strengths || [],
      gaps: c.gaps || [],
      reason: c.reason || '',
      recommendation: getRecommendation(rounded),
      rank: 0 // Will be set after sorting
    };
  }).filter((c: any) => c !== null);

  // Sort by score and assign ranks
  scoredCandidates.sort((a: any, b: any) => b.match_score - a.match_score);
  const ranking = scoredCandidates.slice(0, topN).map((c: any, i: number) => ({
    ...c,
    rank: i + 1
  }));
  
  return {
    job_summary: parsed.job_summary,
    ranking
  };
};

export const screenCandidates = async (
  job: JobInput,
  candidates: CandidateInput[],
  topN = 20
): Promise<ScreeningOutput> => {
  // Create a map for quick candidate lookup during validation
  const candidatesMap = new Map(candidates.filter(c => c.id).map(c => [c.id!, c]));
  
  const prompt = buildPrompt(job, candidates, topN);
  console.log(`[AI] Screening ${candidates.length} candidates for "${job.title}"`);
  console.log(`[AI] Requirements: ${(job.required_skills || []).length} skills, ${(job.required_documents || []).length} docs, ${(job.application_questions || []).length} questions`);
  console.log(`[AI] Prompt size: ${prompt.length} chars`);
  
  let lastError: Error = new Error("No models available");

  for (let i = 0; i < MODELS.length; i++) {
    const modelName = MODELS[i];
    try {
      console.log(`[AI] Trying: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0 },
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Model timeout after 60s')), 60000)
      );
      
      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      const text = result.response.text();
      const output = parseOutput(text, topN, candidatesMap, job);
      console.log(`[AI] ✓ Success with ${modelName}: Ranked ${output.ranking.length}/${candidates.length} candidates`);
      return output;
    } catch (err: any) {
      const msg = err.message || '';
      const is429 = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate');
      const isTimeout = msg.toLowerCase().includes('timeout');
      console.warn(`[AI] ✗ ${modelName} failed${is429 ? ' (rate limit)' : isTimeout ? ' (timeout)' : ''}: ${msg.slice(0, 150)}`);
      lastError = err;
      
      // Add progressive delay for rate limits - longer delays
      if (is429 && i < MODELS.length - 1) {
        const delay = (i + 1) * 5000;
        console.log(`[AI] Rate limit hit. Waiting ${delay}ms before trying next model...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("[AI] All models failed. Last error:", lastError);
  throw new Error(`All AI models failed. ${lastError.message?.includes('429') ? 'Rate limit exceeded - please try again in a few minutes.' : 'Please try again later.'}`);
};
