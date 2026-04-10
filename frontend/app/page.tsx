"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadJobs } from "../store/slices/jobsSlice";
import { fetchMyJobsCandidates, fetchCandidates } from "../lib/api";
import { Briefcase, Users, Zap, TrendingUp, FileText, Sparkles, ArrowRight, Brain, Plus, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { items: jobs, loading: jobsLoading } = useAppSelector((s) => s.jobs);
  const [candidateCount, setCandidateCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.role === "recruiter") {
      dispatch(loadJobs());
      Promise.all([fetchMyJobsCandidates(), fetchCandidates()])
        .then(([applicants, imported]) => setCandidateCount(applicants.length + imported.length))
        .catch(() => {});
    } else if (user?.role === "applicant") {
      router.push("/board");
    }
  }, [dispatch, user, router]);

  // Landing page
  if (!user) {
    return (
      <div className={`min-h-[85vh] flex flex-col items-center justify-center text-center px-4 transition-all duration-500 ${mounted ? "animate-fade-in" : "opacity-0"}`}>
        <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden mb-12 p-12"
          style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #6C63FF, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #8B5CF6, transparent 70%)" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
              <Sparkles size={13} className="text-yellow-300" /> AI-powered · Built for Africa
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
              🌍 {process.env.NEXT_PUBLIC_APP_NAME?.split(" ").slice(0, -1).join(" ") || "TalentLink"} <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">{process.env.NEXT_PUBLIC_APP_NAME?.split(" ").slice(-1)[0] || "Africa"}</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              Smarter hiring powered by Google Gemini. Rank candidates by skills, experience, projects & education instantly.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/board" className="bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition shadow-lg hover:scale-105 duration-200">
                Browse Jobs
              </Link>
              <Link href="/auth/register" className="btn-glow px-8 py-3 rounded-xl text-white font-bold hover:scale-105 duration-200">
                Get Started <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
          {[
            { icon: Briefcase, title: "Post & Manage Jobs", desc: "Create listings with custom requirements, questions, and deadlines", gradient: "from-indigo-500 to-blue-500" },
            { icon: Brain, title: "Gemini AI Screening", desc: "Weighted scoring across skills, experience, projects & education", gradient: "from-violet-500 to-purple-500" },
            { icon: Users, title: "Ranked Shortlists", desc: "Top candidates with full AI reasoning, strengths & gaps", gradient: "from-blue-500 to-cyan-500" },
          ].map(({ icon: Icon, title, desc, gradient }) => (
            <div key={title} className="glass-card p-6 text-left group cursor-default">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const openJobs = safeJobs.filter((j) => j.status === "open");

  const stats = [
    { label: "Total Jobs", value: safeJobs.length, icon: Briefcase, trend: "+2 this week", href: "/jobs" },
    { label: "Open Jobs", value: openJobs.length, icon: TrendingUp, trend: "Active listings", href: "/jobs" },
    { label: "Candidates", value: candidateCount, icon: Users, trend: "In your pool", href: "/candidates" },
    { label: "Ready to Screen", value: openJobs.length, icon: Zap, trend: "Jobs awaiting AI", href: "/jobs" },
  ];

  const actions = [
    { href: "/jobs/new", icon: Plus, title: "Create New Job", desc: "Post a job with AI-powered screening" },
    { href: "/candidates", icon: Users, title: "Manage Candidates", desc: "View, import, or upload candidate profiles" },
    { href: "/jobs", icon: Brain, title: "Run AI Screening", desc: "Select a job and trigger Gemini screening" },
  ];

  return (
    <div className={`space-y-8 transition-all duration-500 ${mounted ? "animate-slide-up" : "opacity-0"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your recruitment today.</p>
        </div>
        <Link href="/jobs/new" className="btn-glow px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 hidden sm:flex">
          <Plus size={16} /> Create Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, trend, href }, i) => (
          <Link key={label} href={href} className="glass-card p-5 group" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl accent-icon-bg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Icon size={20} className="text-white" />
              </div>
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 mt-1" style={{ color: "var(--accent)" }} />
            </div>
            <div className="stat-number mb-1">{value}</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{trend}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="glass-card p-5 group flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl accent-icon-bg flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Jobs</h2>
          <Link href="/jobs" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : safeJobs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-indigo-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No jobs yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first job to start screening candidates</p>
            <Link href="/jobs/new" className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white">
              <Plus size={15} /> Create First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeJobs.slice(0, 4).map((job, i) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="glass-card p-5 group flex items-start gap-4"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Left accent */}
                <div className={`w-1 self-stretch rounded-full shrink-0 ${job.status === "open" ? "bg-gradient-to-b from-emerald-400 to-teal-500" : "bg-gradient-to-b from-gray-300 to-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${job.status === "open" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{job.experience_level} · {job.location || "Remote"}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.required_skills.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                    {job.required_skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{job.required_skills.length - 3}</span>
                    )}
                  </div>
                </div>
                <ArrowRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
