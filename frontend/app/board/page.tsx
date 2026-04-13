"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicJobs } from "../../lib/api";
import { Job } from "../../types";
import { MapPin, Briefcase, Search, Sparkles, Calendar, Clock } from "lucide-react";
import AdBanner, { Ad } from "../../components/ui/AdBanner";
import { fetchPublicAds } from "../../lib/api";

const FILTERS = ["All", "Remote", "Internship", "AI / ML", "Kigali", "Full-time"];

function useCountdown(deadline?: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(d).padStart(2,"0")}d : ${String(h).padStart(2,"0")}h : ${String(m).padStart(2,"0")}m : ${String(s).padStart(2,"0")}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    fetchPublicJobs().then((data) => { setJobs(data); setLoading(false); });
    fetchPublicAds().then(setAds).catch(() => {});
  }, []);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.required_skills.some((s) => s.toLowerCase().includes(q));

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Remote" && j.location?.toLowerCase().includes("remote")) ||
      (activeFilter === "Internship" && j.experience_level?.toLowerCase().includes("intern")) ||
      (activeFilter === "AI / ML" && j.required_skills.some((s) => ["ai", "ml", "machine learning", "deep learning", "nlp"].includes(s.toLowerCase()))) ||
      (activeFilter === "Kigali" && j.location?.toLowerCase().includes("kigali")) ||
      (activeFilter === "Full-time" && !j.experience_level?.toLowerCase().includes("intern"));

    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-10 px-6 py-14 text-center hero-board-gradient">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
            <Sparkles size={13} /> We analyze your skills and match you instantly
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            Smarter Job Search<br />Starts Here
          </h1>
          <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
            AI-powered matching connects you to the right opportunities across Africa
          </p>
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className={`flex items-center bg-white rounded-2xl shadow-2xl transition-all duration-200 ${focused ? "ring-4 ring-white/40" : ""}`}>
              <Search className="ml-4 shrink-0 transition-colors duration-200" size={20} style={{ color: focused ? "var(--accent)" : "#9ca3af" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search jobs, skills, or companies…"
                className="flex-1 px-4 py-4 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
              />
              {search && <button onClick={() => setSearch("")} className="mr-3 text-xs text-gray-400 hover:text-gray-600">✕</button>}
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all duration-150 ${
                  activeFilter === f ? "bg-white shadow-md font-semibold" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
                style={activeFilter === f ? { color: "var(--accent)" } : {}}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Loading…" : <><span className="font-semibold text-gray-800 dark:text-gray-200">{filtered.length}</span> jobs found</>}
        </p>
        {activeFilter !== "All" && (
          <button onClick={() => setActiveFilter("All")} className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
            Clear filter
          </button>
        )}
      </div>

      {/* Main layout: jobs + ad sidebar */}
      <div className={ads.length > 0 ? "flex gap-5 items-start" : ""}>
        {/* Job list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-2/5 mb-3" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}
        </div>

        {/* Ad sidebar — only when ads exist */}
        {ads.length > 0 && (
          <div className="hidden lg:block w-64 shrink-0 sticky top-24">
            <AdBanner ads={ads} />
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const countdown = useCountdown(job.deadline);

  return (
    <div className="glass-card flex items-stretch overflow-hidden group hover:shadow-xl transition-all duration-200">
      {/* Left accent bar */}
      <div className="w-1 shrink-0" style={{ background: "var(--accent)" }} />

      <div className="flex-1 p-5">
        {/* Row 1: title + apply button */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <Link
              href={`/board/${job._id}`}
              className="text-lg font-bold leading-snug hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {job.title}
            </Link>
            {job.organization && (
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5">{job.organization}</p>
            )}
            {job.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {job.location}
              </p>
            )}
          </div>
          <Link
            href={`/board/${job._id}`}
            className="shrink-0 btn-glow text-white text-xs font-bold px-5 py-2 rounded-lg transition-all hover:scale-105"
          >
            APPLY
          </Link>
        </div>

        {/* Row 2: badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {job.experience_level && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
              <Briefcase size={10} /> {job.experience_level}
            </span>
          )}
          {job.salary_range && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
              RWF {job.salary_range}
            </span>
          )}
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            {job.required_skills.length} skills required
          </span>
        </div>

        {/* Row 3: dates + countdown */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> Posted {new Date(job.createdAt).toLocaleDateString()}
          </span>
          {job.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> Deadline {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
          {countdown && countdown !== "Expired" && (
            <span className="flex items-center gap-1 font-mono font-semibold" style={{ color: "var(--accent)" }}>
              <Clock size={11} /> {countdown}
            </span>
          )}
          {countdown === "Expired" && (
            <span className="text-red-400 font-semibold">Deadline passed</span>
          )}
        </div>
      </div>
    </div>
  );
}
