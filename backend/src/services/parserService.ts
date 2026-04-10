import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import { CandidateInput } from "../types";

export const parsePDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer);
  return data.text;
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
