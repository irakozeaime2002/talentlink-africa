import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import path from "path";
import { CandidateInput } from "../types";

export const parsePDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer);
  return data.text;
};

/**
 * Extract readable text from any uploaded document.
 * - PDF: full text extraction
 * - XLSX/CSV: convert to readable rows
 * - DOC/DOCX: return note (binary, not parseable without extra lib)
 * - Images: return note (AI cannot read images as text)
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

export const parseCSV = (buffer: Buffer): CandidateInput[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row, i) => {
    // Try to find name from various possible fields
    const firstName = row.firstName || row.FirstName || row.firstname || row.first_name || row.fname || "";
    const lastName = row.lastName || row.LastName || row.lastname || row.last_name || row.lname || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const name = row.name || row.Name || row.NAME || fullName || row.email || row.Email || `Candidate ${i + 1}`;

    // Extract email
    const email = row.email || row.Email || row.EMAIL || row.mail || "";

    // Build structured text from CSV that AI can easily parse
    const csvLines: string[] = [];
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value && value.toString().trim()) {
        csvLines.push(`${key}: ${value}`);
      }
    });
    const csvText = csvLines.join("\n").slice(0, 2000); // Limit to 2000 chars to avoid huge prompts

    // Try to extract skills from common field names
    const skillFields = ['skills', 'Skills', 'SKILLS', 'technologies', 'Technologies', 'tech_stack', 'expertise', 'Expertise'];
    const skillsRaw = skillFields.map(f => row[f]).find(v => v) || "";
    const skills = skillsRaw ? skillsRaw.split(/[,;|]/).map(s => ({ name: s.trim() })).filter(s => s.name) : [];

    // Try to extract experience
    const expFields = ['experience', 'Experience', 'work_experience', 'years_experience', 'years_of_experience', 'yoe'];
    const expRaw = expFields.map(f => row[f]).find(v => v) || "";
    const companyFields = ['company', 'Company', 'employer', 'Employer', 'organization'];
    const company = companyFields.map(f => row[f]).find(v => v) || "";
    const roleFields = ['role', 'Role', 'title', 'Title', 'position', 'Position', 'job_title'];
    const role = roleFields.map(f => row[f]).find(v => v) || "";
    const experience = (expRaw || company || role) ? [{
      company: company,
      role: role,
      description: expRaw,
    }] : [];

    // Try to extract education
    const eduFields = ['education', 'Education', 'degree', 'Degree', 'qualification', 'Qualification'];
    const eduRaw = eduFields.map(f => row[f]).find(v => v) || "";
    const institutionFields = ['institution', 'Institution', 'university', 'University', 'school', 'School', 'college'];
    const institution = institutionFields.map(f => row[f]).find(v => v) || "";
    const fieldFields = ['field', 'Field', 'major', 'Major', 'field_of_study', 'study_field'];
    const fieldOfStudy = fieldFields.map(f => row[f]).find(v => v) || "";
    const education = (eduRaw || institution) ? [{
      institution: institution,
      degree: eduRaw,
      fieldOfStudy: fieldOfStudy,
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

export const resumeTextToCandidate = (text: string, index: number): CandidateInput => {
  return {
    id: `resume-${index}`,
    name: extractName(text),
    skills: [],
    education: [],
    experience: [{ company: "", role: "See resume", description: text.slice(0, 3000) }],
    projects: [],
    certifications: [],
  };
};

const extractName = (text: string): string => {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0);
  return firstLine?.trim().slice(0, 60) || "Unknown";
};
