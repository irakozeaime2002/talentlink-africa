"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadJobs } from "../store/slices/jobsSlice";
import { fetchMyJobsCandidates, fetchCandidates } from "../lib/api";
import { Briefcase, Users, Zap, TrendingUp, FileText, ArrowRight, Brain, Plus, ChevronRight } from "lucide-react";

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
    } else if (!user) {
      router.push("/home");
    }
  }, [dispatch, user, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !user) return null;

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const openJobs = safeJobs.filter((j) => j.status === "open");

  const stats = [
    { label: "Total Jobs", value: safeJobs.length, icon: Briefcase, trend: "+2 this week", href: "/jobs" },
    { label: "Open Jobs", value: openJobs.length, icon: TrendingUp, trend: "Active listings", href: "/jobs" },
    { label: "Candidates", value: candidateCount, icon: Users, trend: "In your pool", href: "/candidates" },
    { label: "Ready to Screen", value: openJobs.length, icon: Zap, trend: "Jobs awaiting review", href: "/jobs" },
  ];

  const actions = [
    { href: "/jobs/new", icon: Plus, title: "Create New Job", desc: "Post a job with smart screening" },
    { href: "/candidates", icon: Users, title: "Manage Candidates", desc: "View, import, or upload candidate profiles" },
    { href: "/jobs", icon: Brain, title: "Run Screen Candidates", desc: "Select a job and screen applicants" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your recruitment today.</p>
        </div>
        <Link href="/jobs/new" className="btn-glow px-5 py-2.5 rounded-xl text-sm font-bold text-white items-center gap-2 hidden sm:flex">
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
