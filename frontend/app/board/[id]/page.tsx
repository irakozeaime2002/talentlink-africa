"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchPublicJob, fetchJob, fetchMyApplications } from "../../../lib/api";
import { Job } from "../../../types";
import { useAppSelector } from "../../../store/hooks";
import { MapPin, Briefcase, Clock, CheckCircle, ArrowLeft, ChevronRight, DollarSign, Building2, ListChecks, Star, Paperclip, Share, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const skillColor = (s: string) => {
  const map: Record<string, string> = {
    python: "bg-blue-100 text-blue-700", javascript: "bg-yellow-100 text-yellow-700",
    typescript: "bg-blue-100 text-blue-800", react: "bg-cyan-100 text-cyan-700",
    "node.js": "bg-green-100 text-green-700", ml: "bg-purple-100 text-purple-700",
    ai: "bg-violet-100 text-violet-700", java: "bg-orange-100 text-orange-700",
    docker: "bg-sky-100 text-sky-700", aws: "bg-amber-100 text-amber-700",
  };
  return map[s.toLowerCase()] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
};

export default function PublicJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetcher = user?.role === "admin" ? fetchJob(id) : fetchPublicJob(id);
    fetcher.then((j) => { setJob(j); setLoading(false); });
    if (user?.role === "applicant") {
      fetchMyApplications().then((apps) => {
        setAlreadyApplied(apps.some((a) => {
          const jobId = typeof a.job_id === "object" ? (a.job_id as any)._id : a.job_id;
          return jobId === id;
        }));
      }).catch(() => {});
    }
  }, [id, user]);

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse pt-6">
      <div className="h-6 bg-gray-100 dark:bg-white/10 rounded-xl w-24" />
      <div className="h-56 bg-gray-100 dark:bg-white/10 rounded-3xl" />
      <div className="h-40 bg-gray-100 dark:bg-white/10 rounded-2xl" />
    </div>
  );

  if (!job) return <p className="text-gray-400 text-sm">Job not found.</p>;

  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition" style={{ color: "var(--accent)" }}>
        <ArrowLeft size={14} /> Back to Jobs
      </button>

      {/* Hero card */}
      <div className="rounded-3xl overflow-hidden shadow-xl">
        {/* Gradient header */}
        <div className="relative px-8 py-10 text-white overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f0c29 0%, var(--accent) 60%, #0d0d1a 100%)" }}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {job.organization && (
                  <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
                    <Building2 size={14} /> {job.organization}
                  </div>
                )}
                <h1 className="text-3xl font-extrabold leading-tight mb-3">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  {job.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>}
                  {job.experience_level && <span className="flex items-center gap-1.5"><Briefcase size={14} />{job.experience_level}</span>}
                  {job.salary_range && (
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <DollarSign size={14} />RWF {job.salary_range}
                    </span>
                  )}
                  {job.deadline && (
                    <span className={`flex items-center gap-1.5 ${isExpired ? "text-red-300" : "text-white/80"}`}>
                      <Clock size={14} />{isExpired ? "Expired: " : "Deadline: "}{new Date(job.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-1.5 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Open
              </span>
              <button onClick={handleShare} className="shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition">
                {copied ? <><Check size={12} /> Copied!</> : <><Share size={12} /> Share</>}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="glass-card rounded-none p-8 space-y-7">
          {/* Description */}
          <div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg accent-icon-bg flex items-center justify-center">
                  <ListChecks size={14} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white">Responsibilities</h2>
              </div>
              <ul className="space-y-2.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 accent-icon-bg">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} style={{ color: "var(--accent)" }} />
                <p className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Required Skills</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((s) => (
                  <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${skillColor(s)}`}>{s}</span>
                ))}
              </div>
            </div>
            {job.preferred_skills?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-gray-400" />
                  <p className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Preferred Skills</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((s) => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Required documents preview */}
          {job.required_documents?.length > 0 && (
            <div className="pt-5 border-t dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip size={14} style={{ color: "var(--accent)" }} />
                <p className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">Required Documents</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.required_documents.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    <Paperclip size={11} /> {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom questions preview */}
          {job.application_questions?.length > 0 && (
            <div className="pt-5 border-t dark:border-white/10">
              <p className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                Application Questions ({job.application_questions.length})
              </p>
              <ul className="space-y-2">
                {job.application_questions.map((q, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                    <span className="font-bold shrink-0" style={{ color: "var(--accent)" }}>{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Apply CTA — Guest */}
      {!user && (
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 accent-icon-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={26} className="text-white" />
          </div>
          <h2 className="font-extrabold text-gray-900 dark:text-white text-xl mb-2">Ready to Apply?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Create a free account or sign in to submit your application in seconds.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/auth/register" className="btn-glow text-white px-6 py-3 rounded-xl text-sm font-bold">
              Create Account
            </Link>
            <Link href="/auth/login" className="border-2 px-6 py-3 rounded-xl text-sm font-bold hover:opacity-80 transition"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Apply CTA — Applicant */}
      {user?.role === "applicant" && (
        <div className="glass-card p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alreadyApplied ? "bg-emerald-100 dark:bg-emerald-900/30" : "accent-icon-bg"}`}>
              <CheckCircle size={22} className={alreadyApplied ? "text-emerald-500" : "text-white"} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {alreadyApplied ? "Application Submitted ✓" : "Ready to Apply?"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {alreadyApplied
                  ? "You've already applied — track your status below"
                  : "Your professional profile will be attached automatically"}
              </p>
            </div>
          </div>
          {alreadyApplied ? (
            <Link href="/my-applications" className="shrink-0 btn-glow text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckCircle size={15} /> View Application
            </Link>
          ) : (
            <Link href={`/board/${id}/apply`} className="shrink-0 btn-glow text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
              Apply Now <ChevronRight size={16} />
            </Link>
          )}
        </div>
      )}

      {user?.role === "recruiter" && (
        <div className="glass-card p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 accent-icon-bg rounded-2xl flex items-center justify-center shrink-0">
              <Share size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Share this job</p>
              <p className="text-xs text-gray-400 mt-0.5">Share or copy the link to send to potential candidates</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="flex items-center gap-2 btn-glow text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">
              {copied ? <><Check size={15} /> Copied!</> : <><Share size={15} /> Share</>}
            </button>
            <button onClick={handleCopy} className="flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
              style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
