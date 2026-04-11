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

  return rows.map((row, i) => ({
    id: row.id || `csv-${i}`,
    name: row.name || row.Name || "",
    email: row.email || row.Email || "",
    skills: row.skills ? row.skills.split(",").map((s) => s.trim()) : [],
    education: row.education
      ? [{ degree: row.education, field: "", institution: "" }]
      : [],
    experience: row.experience
      ? [{ title: "", company: "", duration: row.experience }]
      : [],
    projects: [],
    certifications: row.certifications
      ? row.certifications.split(",").map((c) => c.trim())
      : [],
  }));
};

export const resumeTextToCandidate = (text: string, index: number): CandidateInput => {
  // Returns raw text as description for Gemini to parse further
  return {
    id: `resume-${index}`,
    name: extractName(text),
    skills: [],
    education: [],
    experience: [{ title: "See resume", company: "", duration: "", description: text.slice(0, 3000) }],
    projects: [],
    certifications: [],
  };
};

const extractName = (text: string): string => {
  const firstLine = text.split("\n").find((l) => l.trim().length > 0);
  return firstLine?.trim().slice(0, 60) || "Unknown";
};
