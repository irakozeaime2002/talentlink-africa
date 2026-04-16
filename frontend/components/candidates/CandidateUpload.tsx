"use client";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { importCSV, importResumes } from "../../store/slices/candidatesSlice";
import toast from "react-hot-toast";

import { Candidate } from "../../types";

interface Props {
  jobId?: string;
  onImported?: (newCandidates: Candidate[]) => void;
}

export default function CandidateUpload({ jobId, onImported }: Props) {
  const dispatch = useAppDispatch();
  const csvRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<"csv" | "resume" | null>(null);

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading("csv");
    try {
      const res = await dispatch(importCSV({ file, jobId })).unwrap();
      toast.success(`Imported ${res.inserted} candidates from CSV`);
      onImported?.(res.candidates);
    } catch {
      toast.error("CSV import failed");
    } finally {
      setLoading(null);
      e.target.value = "";
    }
  };

  const handleResumes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading("resume");
    try {
      const res = await dispatch(importResumes({ files, jobId })).unwrap();
      toast.success(`Imported ${res.inserted} resumes`);
      onImported?.(res.candidates);
    } catch {
      toast.error("Resume import failed");
    } finally {
      setLoading(null);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-3">
      <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCSV} />
      <input ref={resumeRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleResumes} />

      <button
        onClick={() => csvRef.current?.click()}
        disabled={!!loading}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload size={16} />
        {loading === "csv" ? "Importing..." : "Import CSV"}
      </button>

      <button
        onClick={() => resumeRef.current?.click()}
        disabled={!!loading}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload size={16} />
        {loading === "resume" ? "Importing..." : "Upload Resumes (PDF)"}
      </button>
    </div>
  );
}
