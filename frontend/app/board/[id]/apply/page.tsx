"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPublicJob, applyToJob, fetchMyProfile, fetchMyApplications } from "../../../../lib/api";
import { Job } from "../../../../types";
import { useAppSelector } from "../../../../store/hooks";
import toast from "react-hot-toast";
import { ArrowLeft, Send, CheckCircle, AlertCircle, MapPin, Briefcase, Clock, Paperclip, Upload, FileText } from "lucide-react";
import Link from "next/link";

// Auto-resize textarea hook
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

// Auto-resize textarea component
function AutoTextarea({
  value, onChange, placeholder, minRows = 3, className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
}) {
  const ref = useAutoResize(value);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden transition-all ${className}`}
    />
  );
}

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "applicant") { router.push(`/board/${id}`); return; }

    fetchPublicJob(id).then((j) => {
      setJob(j);
      setAnswers(j.application_questions?.map(() => "") || []);
      setLoading(false);
    });

    fetchMyProfile()
      .then((p) => {
        console.log("[Profile check]", JSON.stringify(p));
        const hasSkills = Array.isArray(p?.skills) && p.skills.filter((s: string) => s.trim()).length > 0;
        const hasExperience = Array.isArray(p?.experience) && p.experience.some((e: any) => e.title?.trim().length > 0);
        console.log("[Profile]", { hasSkills, hasExperience });
        setProfileComplete(hasSkills && hasExperience);
      })
      .catch(() => setProfileComplete(false));

    // Check if already applied
    fetchMyApplications()
      .then((apps) => {
        const exists = apps.some((a) => {
          const jobId = typeof a.job_id === "object" ? (a.job_id as any)._id : a.job_id;
          return jobId === id;
        });
        if (exists) setAlreadyApplied(true);
      })
      .catch(() => {});
  }, [id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);
      const answersData = job?.application_questions?.map((q, i) => ({ question: q, answer: answers[i] || "" })) || [];
      formData.append("answers", JSON.stringify(answersData));
      Object.entries(docFiles).forEach(([name, file]) => {
        formData.append("documents", file, file.name);
      });
      await applyToJob(id, formData as any);
      toast.success("Application submitted!");
      router.push("/my-applications");
    } catch (err: any) {
      if (err.message?.includes("Already applied") || err.message?.includes("conflict") || err.message?.includes("already")) {
        setAlreadyApplied(true);
      } else {
        toast.error(err.message || "Failed to apply");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse pt-6">
      <div className="h-6 bg-gray-100 rounded-xl w-1/3" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!job) return <p className="text-gray-400 text-sm">Job not found.</p>;

  if (alreadyApplied) return (
    <div className="max-w-lg mx-auto text-center py-24">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-indigo-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Already Applied</h2>
      <p className="text-gray-500 mb-8">You have already submitted an application for <span className="font-semibold text-gray-700">{job.title}</span>. You cannot apply twice to the same job.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/my-applications" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          View My Applications
        </Link>
        <Link href="/board" className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
          Browse More Jobs
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft size={14} /> Back to Job
      </button>

      {/* Job summary banner */}
      <div
        className="rounded-2xl px-6 py-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #6C63FF 0%, #4A90E2 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
        <h1 className="text-xl font-bold mb-1 relative z-10">Applying for: {job.title}</h1>
        <div className="flex flex-wrap gap-4 text-indigo-200 text-sm relative z-10">
          {job.location && <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>}
          {job.experience_level && <span className="flex items-center gap-1"><Briefcase size={13} />{job.experience_level}</span>}
          {job.salary_range && <span className="text-white font-medium">RWF {job.salary_range}</span>}
          {job.deadline && <span className="flex items-center gap-1"><Clock size={13} />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Profile status */}
      {profileComplete === null ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 animate-pulse">
          <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
      ) : profileComplete ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CheckCircle size={20} className="text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 text-sm">Profile ready</p>
            <p className="text-xs text-green-600 mt-0.5">Your skills, experience, education and projects will be attached.</p>
          </div>
          <Link href={`/profile?returnTo=/board/${id}/apply`} className="shrink-0 text-xs text-green-600 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium transition">Edit</Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Profile incomplete</p>
            <p className="text-xs text-amber-600 mt-0.5">Add skills & experience for better results.</p>
          </div>
          <Link href={`/profile?returnTo=/board/${id}/apply`} className="shrink-0 text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 font-medium transition">Complete Now</Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Custom questions */}
        {job.application_questions?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-gray-900">Application Questions</h2>
            {job.application_questions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{i + 1}. {q}</label>
                <AutoTextarea
                  value={answers[i] || ""}
                  onChange={(v) => { const n = [...answers]; n[i] = v; setAnswers(n); }}
                  placeholder="Your answer…"
                  minRows={3}
                />
              </div>
            ))}
          </div>
        )}

        {/* Required Documents */}
        {job.required_documents?.length > 0 && (
          <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Paperclip size={16} style={{ color: "var(--accent)" }} />
              <h2 className="font-bold text-gray-900 dark:text-white">Required Documents</h2>
            </div>
            <p className="text-xs text-gray-400">PDFs will be analyzed by AI to improve your screening score.</p>
            {job.required_documents.map((docName) => (
              <div key={docName}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {docName} <span className="text-red-400">*</span>
                </label>
                <label className="flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition hover:border-opacity-80"
                  style={{ borderColor: docFiles[docName] ? "var(--accent)" : "#e5e7eb", background: docFiles[docName] ? "var(--accent-light)" : "transparent" }}>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setDocFiles((prev) => ({ ...prev, [docName]: file }));
                    }} />
                  {docFiles[docName] ? (
                    <>
                      <FileText size={18} style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{docFiles[docName].name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Click to upload {docName} (PDF, DOC, image)</span>
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Cover letter */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">
            Cover Letter <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-3">Tell the recruiter why you're a great fit for this role</p>
          <AutoTextarea
            value={coverLetter}
            onChange={setCoverLetter}
            placeholder="I'm excited to apply for this role because…"
            minRows={5}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition text-sm shadow-lg shadow-indigo-100"
        >
          <Send size={16} /> {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
