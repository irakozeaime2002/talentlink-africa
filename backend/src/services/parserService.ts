/**
 * Parser Service - Extracts data from uploaded files
 * 
 * This service handles the messy work of reading different file formats and
 * turning them into structured data the AI can understand.
 * 
 * We support:
 * - PDFs (resumes, certificates, transcripts)
 * - Excel/CSV (bulk candidate imports)
 * - Word docs (limited - we note they were submitted but can't extract text easily)
 * - Images (we note they were submitted as visual evidence)
 * 
 * The goal is to be flexible - accept whatever format recruiters have,
 * extract what we can, and let the AI figure out the rest.
 */

import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import path from "path";
import { CandidateInput } from "../types";

// Simple PDF text extraction - works for most standard resumes
export const parsePDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer);
  return data.text;
};

/**
 * Extract readable text from any uploaded document
 * 
 * This is used during AI screening to validate that candidates uploaded the
 * right documents. For example, if a job requires a "CV", we extract the text
 * and let the AI check if it actually looks like a CV (has experience, skills, etc).
 * 
 * Different file types need different handling:
 * - PDF: Full text extraction works great
 * - Excel/CSV: Convert to readable rows
 * - Word: Binary format, would need mammoth.js (not worth the dependency)
 * - Images: Can't extract text without OCR (too expensive/slow)
 * 
 * We limit text length to avoid sending huge documents to the AI (costs money).
 */
export const extractDocumentText = async (buffer: Buffer, filename: string): Promise<string> => {
  const ext = path.extname(filename).toLowerCase();
  try {
    if (ext === ".pdf") {
      const data = await pdfParse(buffer);
      return data.text.slice(0, 5000);
    }
    if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const text = XLSX.utils.sheet_to_csv(sheet);
      return `[Spreadsheet content]\n${text.slice(0, 3000)}`;
    }
    if (ext === ".doc" || ext === ".docx") {
      return `[Word document: ${filename} — content not extractable, but document was submitted]`;
    }
    if ([".png", ".jpg", ".jpeg"].includes(ext)) {
      return `[Image document: ${filename} — submitted as visual evidence]`;
    }
    return `[Document: ${filename} — submitted]`;
  } catch {
    return `[Document: ${filename} — could not extract text]`;
  }
};

/**
 * Parse CSV/Excel files into candidate profiles
 * 
 * This is the trickiest part - every company exports data differently.
 * Someone might have columns named "Skills", "skills", "SKILLS", "Technologies", etc.
 * 
 * Our strategy:
 * 1. Try to detect common column names and extract structured data (skills[], experience[], etc)
 * 2. Store ALL the raw CSV data in the bio field as backup
 * 3. Let the AI read both during screening - it's smart enough to handle variations
 * 
 * This way we get the best of both worlds - structured data when possible,
 * but we never lose information if the column names are weird.
 */
export const parseCSV = (buffer: Buffer): CandidateInput[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row, i) => {
    // Try to find name from various possible column names
    // People export CSVs from different systems with different headers
    const firstName = row.firstName || row.FirstName || row.firstname || row.first_name || row.fname || "";
    const lastName = row.lastName || row.LastName || row.lastname || row.last_name || row.lname || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const name = row.name || row.Name || row.NAME || fullName || row.email || row.Email || `Candidate ${i + 1}`;

    // Extract email
    const email = row.email || row.Email || row.EMAIL || row.mail || "";

    // Build a text representation of ALL CSV fields
    // This ensures we don't lose any data even if we don't recognize the column names
    // The AI can read this during screening and extract whatever it needs
    const csvLines: string[] = [];
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value && value.toString().trim()) {
        csvLines.push(`${key}: ${value}`);
      }
    });
    const csvText = csvLines.join("\n").slice(0, 2000); // Limit to 2000 chars to avoid huge prompts

    // Try to extract skills - look for common column names
    // Split by commas, semicolons, or pipes (different export formats use different separators)
    const skillFields = ['skills', 'Skills', 'SKILLS', 'technologies', 'Technologies', 'tech_stack', 'expertise', 'Expertise'];
    const skillsRaw = skillFields.map(f => row[f]).find(v => v) || "";
    const skills = skillsRaw ? skillsRaw.split(/[,;|]/).map(s => ({ name: s.trim() })).filter(s => s.name) : [];

    // Try to extract work experience from various possible column combinations
    // Support both camelCase and Umurava schema ("Start Date", "End Date", "Is Current")
    const expFields = ['experience', 'Experience', 'work_experience', 'years_experience', 'years_of_experience', 'yoe'];
    const expRaw = expFields.map(f => row[f]).find(v => v) || "";
    const companyFields = ['company', 'Company', 'employer', 'Employer', 'organization'];
    const company = companyFields.map(f => row[f]).find(v => v) || "";
    const roleFields = ['role', 'Role', 'title', 'Title', 'position', 'Position', 'job_title'];
    const role = roleFields.map(f => row[f]).find(v => v) || "";
    const startDateFields = ['startDate', 'Start Date', 'start_date', 'from', 'From'];
    const startDate = startDateFields.map(f => row[f]).find(v => v) || "";
    const endDateFields = ['endDate', 'End Date', 'end_date', 'to', 'To'];
    const endDate = endDateFields.map(f => row[f]).find(v => v) || "";
    const isCurrentFields = ['isCurrent', 'Is Current', 'is_current', 'current', 'Current'];
    const isCurrentRaw = isCurrentFields.map(f => row[f]).find(v => v);
    // Convert various truthy values to boolean
    const isCurrent = isCurrentRaw === 'true' || isCurrentRaw === 'True' || isCurrentRaw === 'TRUE' || 
                      isCurrentRaw === 'Yes' || isCurrentRaw === 'yes' || isCurrentRaw === 'YES' ||
                      isCurrentRaw === '1' || isCurrentRaw === 'Present' || isCurrentRaw === 'present';
    
    const experience = (expRaw || company || role) ? [{
      company: company,
      role: role,
      description: expRaw,
      startDate: startDate,
      endDate: endDate,
      isCurrent: isCurrent
    }] : [];

    // Try to extract education - support Umurava schema ("Field of Study", "Start Year", "End Year")
    const eduFields = ['education', 'Education', 'degree', 'Degree', 'qualification', 'Qualification'];
    const eduRaw = eduFields.map(f => row[f]).find(v => v) || "";
    const institutionFields = ['institution', 'Institution', 'university', 'University', 'school', 'School', 'college'];
    const institution = institutionFields.map(f => row[f]).find(v => v) || "";
    const fieldFields = ['field', 'Field', 'major', 'Major', 'field_of_study', 'Field of Study', 'fieldOfStudy', 'study_field'];
    const fieldOfStudy = fieldFields.map(f => row[f]).find(v => v) || "";
    const startYearFields = ['startYear', 'Start Year', 'start_year', 'from_year'];
    const startYear = startYearFields.map(f => row[f]).find(v => v) || "";
    const endYearFields = ['endYear', 'End Year', 'end_year', 'to_year', 'graduation_year'];
    const endYear = endYearFields.map(f => row[f]).find(v => v) || "";
    
    const education = (eduRaw || institution) ? [{
      institution: institution,
      degree: eduRaw,
      fieldOfStudy: fieldOfStudy,
      startYear: startYear ? parseInt(startYear, 10) : undefined,
      endYear: endYear ? parseInt(endYear, 10) : undefined
    }] : [];

    // Try to extract certifications
    const certFields = ['certifications', 'Certifications', 'certificates', 'Certificates', 'certs'];
    const certsRaw = certFields.map(f => row[f]).find(v => v) || "";
    const certifications = certsRaw ? certsRaw.split(/[,;|]/).map(c => ({ name: c.trim() })).filter(c => c.name) : [];

    // Try to extract projects
    const projectFields = ['projects', 'Projects', 'portfolio', 'Portfolio', 'work_samples'];
    const projectsRaw = projectFields.map(f => row[f]).find(v => v) || "";
    const projects = projectsRaw ? projectsRaw.split(/[;|]/).map(p => ({
      name: p.trim(),
      description: p.trim(),
    })).filter(p => p.name) : [];

    return {
      id: row.id || row.ID || `csv-${i}`,
      name,
      email,
      headline: row.headline || row.Headline || row.title || row.Title || row.position || row.Position || "",
      location: row.location || row.Location || row.city || row.City || row.address || row.Address || "",
      bio: `[CSV Import - All Fields]\n${csvText}`,
      skills,
      education,
      experience,
      projects,
      certifications,
    };
  });
};

/**
 * Convert raw resume text into a basic candidate profile
 * 
 * When someone uploads a PDF resume, we can't perfectly parse it into structured
 * fields (that would require complex NLP). Instead, we store the full text in
 * cv_text field and let the deterministic scoring search it for job requirements.
 * 
 * The scoring engine will search cv_text for:
 * - Required skills mentioned anywhere in the resume
 * - Years of experience patterns ("5 years", "since 2020", etc.)
 * - Education keywords (degree, university, graduated)
 * - Project keywords (built, developed, portfolio)
 */
export const resumeTextToCandidate = (text: string, index: number): CandidateInput => {
  return {
    id: `resume-${index}`,
    name: extractName(text),
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    cv_text: text.slice(0, 10000), // Store full resume text for scoring
  };
};

// Try to extract a name from the resume - usually it's on the first line
// If we can't find it, we'll just call them "Unknown" and let the recruiter fix it
const extractName = (text: string): string => {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0);
  return firstLine?.trim().slice(0, 60) || "Unknown";
};
