"use client";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadCandidates, removeCandidate, bulkRemoveCandidates } from "../../store/slices/candidatesSlice";
import toast from "react-hot-toast";
import {
  Trash2, Search, Briefcase, Mail, Users, FileSpreadsheet,
  ChevronDown, MapPin, Award, FolderOpen, Filter, CheckSquare, Square,
} from "lucide-react";
import { fetchMyJobsCandidates, fetchJobs } from "../../lib/api";
import { Candidate, Job } from "../../types";
import Link from "next/link";

type StatusFilter = "all" | "pending" | "reviewed" | "shortlisted" | "rejected";

const STATUS_CONFIG: Record<StatusFilter, { label: string; pill: string; dot: string }> = {
  all:         { label: "All",         pill: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300",              dot: "bg-gray-400" },
  pending:     { label: "Pending",     pill: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",        dot: "bg-amber-400" },
  reviewed:    { label: "Reviewed",    pill: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",            dot: "bg-blue-400" },
  shortlisted: { label: "Shortlisted", pill: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    pill: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",               dot: "bg-red-400" },
};



interface EnrichedCandidate extends Candidate {
  jobs_applied?: { _id: string; title: string; status?: string }[];
}

export default function CandidatesPage() {
  const dispatch = useAppDispatch();
  const { items: poolCandidates, loading } = useAppSelector((s) => s.candidates);
  const { user } = useAppSelector((s) => s.auth);

  const [applicants, setApplicants] = useState<EnrichedCandidate[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"applicants" | "imported">("applicants");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role !== "recruiter") return;
    dispatch(loadCandidates());
    setApplicantsLoading(true);
    Promise.all([fetchMyJobsCandidates(), fetchJobs()])
      .then(([candidates, jobList]) => { setApplicants(candidates); setJobs(jobList); })
      .catch(() => {})
      .finally(() => setApplicantsLoading(false));
  }, [dispatch, user]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const filteredApplicants = useMemo(() => applicants.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.skills.some((s) => s.name.toLowerCase().includes(q));
    const matchJob = jobFilter === "all" || c.jobs_applied?.some((j) => j._id === jobFilter);
    const matchStatus = statusFilter === "all" || c.jobs_applied?.some((j) => j.status === statusFilter);
    return matchSearch && matchJob && matchStatus;
  }), [applicants, search, statusFilter, jobFilter]);

  const filteredPool = useMemo(() => {
    const q = search.toLowerCase();
    return (poolCandidates as EnrichedCandidate[]).filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.skills.some((s) => s.name.toLowerCase().includes(q));
      const matchJob = jobFilter === "all" || c.jobs_applied?.some((j) => j._id === jobFilter);
      return matchSearch && matchJob;
    });
  }, [poolCandidates, search, jobFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: applicants.length, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 };
    applicants.forEach((c) => {
      c.jobs_applied?.forEach((j) => {
        const st = j.status as StatusFilter;
        if (st && st in counts) counts[st]++;
      });
    });
    return counts;
  }, [applicants]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this candidate?")) return;
    await dispatch(removeCandidate(id));
    toast.success("Candidate removed");
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected candidate(s)?`)) return;
    await dispatch(bulkRemoveCandidates(selectedIds));
    toast.success(`${selectedIds.length} candidate(s) deleted`);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentList = activeTab === "imported" ? filteredPool : [];
    if (selectedIds.length === currentList.length && currentList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map((c) => c._id));
    }
  };

  const CandidateCard = ({ c, showDelete }: { c: EnrichedCandidate; showDelete?: boolean }) => {

    const topJob = c.jobs_applied?.[0];
    const topStatus = (topJob?.status || "pending") as StatusFilter;
    const sc = STATUS_CONFIG[topStatus] || STATUS_CONFIG.pending;
    const isSelected = selectedIds.includes(c._id);

    return (
      <div className={`glass-card p-5 flex flex-col gap-4 group relative overflow-hidden transition-all ${
        isSelected ? "ring-2" : ""
      }`} style={isSelected ? { "--tw-ring-color": "var(--accent)" } as any : {}}>
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60"
          style={{ background: "linear-gradient(90deg, var(--accent), transparent)" }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {showDelete && (
              <button onClick={() => toggleSelect(c._id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0">
                {isSelected ? <CheckSquare size={18} style={{ color: "var(--accent)" }} /> : <Square size={18} />}
              </button>
            )}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md"
              style={{ background: "var(--accent)" }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{c.name}</p>
              {c.email && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={10} className="shrink-0" /> {c.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {c.jobs_applied && c.jobs_applied.length > 0 && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            )}
            {showDelete && (
              <button onClick={() => handleDelete(c._id)} className="text-gray-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Skills */}
        {c.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {c.skills.slice(0, 5).map((s, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                {s.name}
              </span>
            ))}
            {c.skills.length > 5 && (
              <span className="text-xs text-gray-400 px-2 py-1">+{c.skills.length - 5}</span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          {c.experience?.length > 0 && (
            <span className="flex items-center gap-1">
              <Briefcase size={11} />
              {c.experience[0].role}{c.experience[0].company ? ` · ${c.experience[0].company}` : ""}
            </span>
          )}
          {c.education?.length > 0 && (
            <span className="flex items-center gap-1">
              <Award size={11} />
              {c.education[0].degree}
            </span>
          )}
          {c.projects?.length > 0 && (
            <span className="flex items-center gap-1">
              <FolderOpen size={11} />
              {c.projects.length} project{c.projects.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Jobs applied */}
        {c.jobs_applied && c.jobs_applied.length > 0 && (
          <div className="pt-3 border-t dark:border-white/10">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Applied to</p>
            <div className="flex flex-wrap gap-1.5">
              {c.jobs_applied.map((j) => {
                return (
                  <Link key={j._id} href={`/jobs/${j._id}`}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border dark:border-white/10 hover:opacity-80 transition font-medium"
                    style={{ color: "var(--accent)" }}>
                    {j.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="glass-card p-5 animate-pulse space-y-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">{[...Array(3)].map((_, j) => <div key={j} className="h-6 bg-gray-100 dark:bg-white/5 rounded-full w-16" />)}</div>
      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
    </div>
  );

  const isEmpty = activeTab === "applicants" ? filteredApplicants.length === 0 : filteredPool.length === 0;
  const isLoading = activeTab === "applicants" ? applicantsLoading : loading;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Candidates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your talent pool and track application statuses
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["all", "pending", "reviewed", "shortlisted", "rejected"] as StatusFilter[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => { setActiveTab("applicants"); setStatusFilter(s); }}
              className={`glass-card p-4 text-left transition-all ${statusFilter === s && activeTab === "applicants" ? "ring-2" : ""}`}
              style={statusFilter === s && activeTab === "applicants" ? { "--tw-ring-color": "var(--accent)" } as any : {}}>
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {statusFilter === s && activeTab === "applicants" && (
                  <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>Active</span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{statusCounts[s]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
        {[
          { key: "applicants", label: "Job Applicants", icon: <Users size={14} />, count: applicants.length },
          { key: "imported",   label: "Imported Pool",  icon: <FileSpreadsheet size={14} />, count: poolCandidates.length },
        ].map(({ key, label, icon, count }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === key ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            style={activeTab === key ? { color: "var(--accent)" } : {}}>
            {icon} {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={activeTab === key ? { background: "var(--accent-light)", color: "var(--accent)" } : { background: "rgba(0,0,0,0.06)", color: "#6b7280" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-gray-400 shrink-0" />

        {/* Bulk actions */}
        {activeTab === "imported" && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 shrink-0"
            style={{ borderColor: "var(--accent)", background: "var(--accent-light)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              {selectedIds.length} selected
            </span>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--accent)" }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}

        {/* Select all */}
        {activeTab === "imported" && filteredPool.length > 0 && (
          <button onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition">
            {selectedIds.length === filteredPool.length && filteredPool.length > 0 ? (
              <CheckSquare size={14} style={{ color: "var(--accent)" }} />
            ) : (
              <Square size={14} className="text-gray-400" />
            )}
            {selectedIds.length === filteredPool.length && filteredPool.length > 0 ? "Deselect All" : "Select All"}
          </button>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or skill..."
            className="w-full border dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
            style={{ "--tw-ring-color": "var(--accent)" } as any} />
        </div>

        {/* Status pills — applicants only */}
        {activeTab === "applicants" && (
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(STATUS_CONFIG) as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${statusFilter === s ? STATUS_CONFIG[s].pill + " border-transparent shadow-sm" : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        )}

        {/* Job dropdown */}
        {jobs.length > 0 && (
          <div className="relative">
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}
              className="appearance-none border dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
              style={{ "--tw-ring-color": "var(--accent)" } as any}>
              <option value="all">All Jobs</option>
              {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-gray-400 -mt-2">
          Showing <span className="font-semibold text-gray-600 dark:text-gray-300">
            {activeTab === "applicants" ? filteredApplicants.length : filteredPool.length}
          </span> candidate{(activeTab === "applicants" ? filteredApplicants.length : filteredPool.length) !== 1 ? "s" : ""}
          {search && <> matching <span className="font-semibold" style={{ color: "var(--accent)" }}>"{search}"</span></>}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isEmpty ? (
        <div className="glass-card text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-light)" }}>
            {activeTab === "applicants"
              ? <Users size={28} style={{ color: "var(--accent)" }} />
              : <FileSpreadsheet size={28} style={{ color: "var(--accent)" }} />}
          </div>
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">
            {search || statusFilter !== "all" || jobFilter !== "all" ? "No candidates match your filters" : "No candidates yet"}
          </p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            {activeTab === "imported"
              ? "Go to a job's AI Screening tab to upload CSV or PDF resumes"
              : search || statusFilter !== "all" || jobFilter !== "all"
                ? "Try clearing some filters to see more results"
                : "Share your job links so applicants can apply"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === "applicants"
            ? filteredApplicants.map((c) => <CandidateCard key={c._id} c={c} />)
            : filteredPool.map((c) => <CandidateCard key={c._id} c={c as EnrichedCandidate} showDelete />)}
        </div>
      )}

      {activeTab === "imported" && !isLoading && (
        <p className="text-xs text-gray-400 text-center">
          Upload CSV or resumes from a specific job's AI Screening tab.
        </p>
      )}
    </div>
  );
}
