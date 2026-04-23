"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loadJobs, removeJob } from "../../../store/slices/jobsSlice";
import { triggerScreening, loadScreeningResults, removeScreeningResult } from "../../../store/slices/screeningSlice";
import { loadJobApplications } from "../../../store/slices/applicationsSlice";
import CandidateSelector from "../../../components/candidates/CandidateSelector";
import CandidateUpload from "../../../components/candidates/CandidateUpload";
import ShortlistTable from "../../../components/screening/ShortlistTable";
import ApplicationsPanel from "../../../components/applications/ApplicationsPanel";
import toast from "react-hot-toast";
import { Zap, Trash2, Link as LinkIcon, Edit, Clock, MapPin, Users, BarChart2, Brain, ChevronRight, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as api from "../../../lib/api";

type Tab = "applications" | "screen" | "history";

const SKILL_COLORS: Record<string, string> = {
  react: "bg-cyan-100 text-cyan-700", typescript: "bg-blue-100 text-blue-800",
  "node.js": "bg-green-100 text-green-700", python: "bg-blue-100 text-blue-700",
  docker: "bg-sky-100 text-sky-700", aws: "bg-amber-100 text-amber-700",
  javascript: "bg-yellow-100 text-yellow-700", java: "bg-orange-100 text-orange-700",
};
const skillColor = (s: string) => SKILL_COLORS[s.toLowerCase()] ?? "bg-gray-100 text-gray-600";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const job = useAppSelector((s) => s.jobs.items.find((j) => j._id === id));
  const { results, loading: screeningLoading } = useAppSelector((s) => s.screening);
  const { items: applications } = useAppSelector((s) => s.applications);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topN, setTopN] = useState(20);
  const [tab, setTab] = useState<Tab>("applications");
  const [applicantCandidates, setApplicantCandidates] = useState<import("../../../types").Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesCache, setCandidatesCache] = useState<{ data: import("../../../types").Candidate[]; timestamp: number; page: number; hasMore: boolean } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(false);

  const refreshApplicantCandidates = useCallback((forceRefresh = false, loadMore = false) => {
    // Don't load if job doesn't exist yet
    if (!id) return;
    
    const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
    const now = Date.now();
    
    // Use cache if available and fresh (only for first page)
    if (!forceRefresh && !loadMore && candidatesCache && (now - candidatesCache.timestamp) < CACHE_DURATION) {
      setApplicantCandidates(candidatesCache.data);
      setSelectedIds(candidatesCache.data.map((c) => c._id));
      setHasMoreCandidates(candidatesCache.hasMore);
      setCurrentPage(candidatesCache.page);
      return;
    }
    
    const pageToLoad = loadMore ? currentPage + 1 : 1;
    setLoadingCandidates(true);
    
    api.fetchJobApplicantCandidates(id, pageToLoad, 50)
      .then((response) => {
        // Validate response structure
        if (!response || !response.candidates || !Array.isArray(response.candidates)) {
          console.error('Invalid response structure:', response);
          setApplicantCandidates([]);
          setSelectedIds([]);
          setHasMoreCandidates(false);
          setCurrentPage(1);
          return;
        }
        
        const newCandidates = loadMore ? [...applicantCandidates, ...response.candidates] : response.candidates;
        setApplicantCandidates(newCandidates); 
        setSelectedIds(newCandidates.map((c) => c._id));
        setHasMoreCandidates(response.pagination?.hasMore || false);
        setCurrentPage(pageToLoad);
        
        // Only cache first page
        if (!loadMore) {
          setCandidatesCache({ 
            data: newCandidates, 
            timestamp: Date.now(),
            page: pageToLoad,
            hasMore: response.pagination?.hasMore || false
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load candidates:', err);
        // Reset state on error
        setApplicantCandidates([]);
        setSelectedIds([]);
        setHasMoreCandidates(false);
        // Don't show error toast on initial load, only on manual refresh
        if (forceRefresh) {
          toast.error('Failed to load candidates');
        }
      })
      .finally(() => setLoadingCandidates(false));
  }, [id, candidatesCache, currentPage, applicantCandidates]);

  useEffect(() => {
    // Preload ALL data when page loads for instant tab switching
    dispatch(loadJobs());
    dispatch(loadJobApplications({ jobId: id, page: 1, limit: 50 }));
    dispatch(loadScreeningResults({ job_id: id })); // Preload screening results
  }, [dispatch, id]); // Load once when page mounts

  // Load candidates after job is loaded
  useEffect(() => {
    if (job && applicantCandidates.length === 0 && !loadingCandidates && !candidatesCache) {
      refreshApplicantCandidates();
    }
  }, [job, applicantCandidates.length, loadingCandidates, candidatesCache, refreshApplicantCandidates]);

  const handleScreenApplicants = async () => {
    try {
      const CACHE_DURATION = 3 * 60 * 1000;
      const now = Date.now();
      
      // Use cache if available and fresh
      if (candidatesCache && (now - candidatesCache.timestamp) < CACHE_DURATION) {
        setApplicantCandidates(candidatesCache.data);
        setSelectedIds(candidatesCache.data.map((c) => c._id));
        setHasMoreCandidates(candidatesCache.hasMore);
        setCurrentPage(candidatesCache.page);
        setTab("screen");
        toast.success(`${candidatesCache.data.length} applicant${candidatesCache.data.length !== 1 ? "s" : ""} loaded`);
        return;
      }
      
      const response = await api.fetchJobApplicantCandidates(id, 1, 50);
      
      // Validate response structure
      if (!response || !response.candidates || !Array.isArray(response.candidates)) {
        toast.error("Invalid response from server");
        return;
      }
      
      if (response.candidates.length === 0) { 
        toast.error("No candidate profiles found yet"); 
        return; 
      }
      
      setApplicantCandidates(response.candidates);
      setSelectedIds(response.candidates.map((c) => c._id));
      setHasMoreCandidates(response.pagination?.hasMore || false);
      setCurrentPage(1);
      setCandidatesCache({ 
        data: response.candidates, 
        timestamp: Date.now(),
        page: 1,
        hasMore: response.pagination?.hasMore || false
      });
      setTab("screen");
      toast.success(`${response.candidates.length} applicant${response.candidates.length !== 1 ? "s" : ""} loaded`);
    } catch (err) { 
      console.error('Failed to load applicant profiles:', err);
      toast.error("Failed to load applicant profiles"); 
    }
  };

  const handleScreen = async () => {
    if (selectedIds.length === 0) { toast.error("Select at least one candidate"); return; }
    try {
      await dispatch(triggerScreening({ job_id: id, candidate_ids: selectedIds, top_n: topN })).unwrap();
      await dispatch(loadScreeningResults({ job_id: id, forceRefresh: true })).unwrap();
      toast.success("AI Screening complete!");
      setTab("history");
    } catch (err: any) { toast.error(err.message || "Screening failed"); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    await dispatch(removeJob(id));
    toast.success("Job deleted");
    router.push("/jobs");
  };

  const handleDeleteScreening = async (resultId: string) => {
    if (!confirm("Delete this screening result?")) return;
    await dispatch(removeScreeningResult(resultId)).unwrap();
    toast.success("Screening result deleted");
  };

  const copyJobLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board/${id}`);
    toast.success("Job link copied!");
  };

  if (!job) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-gray-400">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm">Loading job...</p>
      </div>
    </div>
  );

  const tabs = [
    { key: "applications" as Tab, label: "Applications", icon: <Users size={15} />, count: applications.length },
    { key: "screen" as Tab, label: "AI Screening", icon: <Brain size={15} />, count: null },
    { key: "history" as Tab, label: "Results", icon: <BarChart2 size={15} />, count: results.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/jobs")}
        className="flex items-center gap-1.5 text-sm font-medium transition"
        style={{ color: "var(--accent)" }}
      >
        <ArrowLeft size={15} /> Back to My Jobs
      </button>

      {/* Hero header */}
      <div className="rounded-2xl overflow-hidden relative hero-board-gradient">
        <div className="absolute -top-10 -right-10 w-80 h-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20">
                  <span className={`w-2 h-2 rounded-full shadow-lg ${ job.status === "open" ? "bg-emerald-400 shadow-emerald-400/80" : job.status === "draft" ? "bg-amber-400 shadow-amber-400/80" : "bg-gray-400" }`} />
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/40 backdrop-blur-sm">
                  {job.experience_level}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-sky-300"><MapPin size={14} />{job.location || "Remote"}</span>
                {job.salary_range && <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">💰 RWF {job.salary_range}</span>}
                {job.deadline && <span className="flex items-center gap-1.5 text-rose-300"><Clock size={14} />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              <button onClick={copyJobLink} className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition">
                <LinkIcon size={13} /> Share
              </button>
              <Link href={`/jobs/${id}/edit`} className="flex items-center gap-1.5 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-3 py-2 rounded-xl border border-sky-400/30 backdrop-blur-sm transition">
                <Edit size={13} /> Edit
              </Link>
              <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-2 rounded-xl border border-rose-400/30 backdrop-blur-sm transition">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          <p className="text-white/90 text-sm leading-relaxed mb-6 max-w-3xl">{job.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {job.required_skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${skillColor(s)}`}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {job.preferred_skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-2">Preferred Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferred_skills.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-500/25 text-violet-200 border border-violet-400/40">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {job.responsibilities?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-sky-300 uppercase tracking-widest mb-2">Responsibilities</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <CheckCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.application_questions?.length > 0 && (
            <div className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-2">Custom Questions ({job.application_questions.length})</p>
              <ul className="space-y-1">
                {job.application_questions.map((q, i) => (
                  <li key={i} className="text-sm text-white/90 flex items-start gap-2">
                    <span className="text-amber-300 shrink-0 font-bold">{i + 1}.</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm px-6 md:px-8 py-3 flex flex-wrap gap-6">
          {[
            { label: "Applications", value: applications.length, color: "text-pink-400" },
            { label: "Screening Runs", value: results.length, color: "text-violet-400" },
            { label: "Ready to Screen", value: applicantCandidates.length, color: "text-sky-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`text-xl font-extrabold ${color}`}>{value}</span>
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Screen applicants CTA */}
      {applications.length > 0 && (
        <div className="btn-glow rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{applications.length} applicant{applications.length !== 1 ? "s" : ""} ready to screen</p>
              <p className="text-white/70 text-xs mt-0.5">Run AI screening to rank and shortlist the best candidates</p>
            </div>
          </div>
          <button
            onClick={handleScreenApplicants}
            className="shrink-0 flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md"
            style={{ color: "var(--accent)" }}
          >
            Screen Now <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
        {tabs.map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
            style={tab === key ? { color: "var(--accent)" } : {}}
          >
            {icon} {label}
            {count !== null && count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {tab === "applications" && (
        <div className="glass-card p-6">
          <ApplicationsPanel jobId={id} />
        </div>
      )}

      {/* AI Screening tab */}
      {tab === "screen" && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Candidates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Applicants for this job are listed below. You can also add candidates from the pool.</p>
            </div>
            <CandidateUpload jobId={id} onImported={(newCandidates) => {
            setApplicantCandidates((prev) => {
              const existingIds = new Set(prev.map((c) => c._id));
              const fresh = newCandidates.filter((c) => !existingIds.has(c._id));
              return [...prev, ...fresh];
            });
            setSelectedIds((prev) => [...prev, ...newCandidates.map((c) => c._id)]);
          }} />
          </div>

          {loadingCandidates ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading candidates...</p>
            </div>
          ) : applicantCandidates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No applicants have applied to this job yet.</p>
              <p className="text-xs mt-1">Share the job link or upload candidates manually.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700">
                  {applicantCandidates.length} applicant{applicantCandidates.length !== 1 ? "s" : ""} who applied to this job.
                </p>
              </div>
              <CandidateSelector
                candidates={applicantCandidates}
                selected={selectedIds}
                onChange={setSelectedIds}
                onLoadMore={() => refreshApplicantCandidates(false, true)}
                hasMore={hasMoreCandidates}
                loading={loadingCandidates}
              />
            </>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500 dark:text-gray-400 font-medium">Shortlist Top:</label>
              <input
                type="number"
                min="1"
                max={selectedIds.length}
                value={topN}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= selectedIds.length) {
                    setTopN(val);
                  }
                }}
                className="border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="20"
              />
              <span className="text-xs text-gray-400">of {selectedIds.length}</span>
            </div>
            <button
              onClick={handleScreen}
              disabled={screeningLoading || selectedIds.length === 0}
              className="flex items-center gap-2 btn-glow text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition"
            >
              <Zap size={16} />
              {screeningLoading ? "AI is screening…" : `Run AI Screening (${selectedIds.length} selected)`}
            </button>
          </div>
        </div>
      )}

      {/* Results history tab */}
      {tab === "history" && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-14 h-14 accent-bg-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain size={28} style={{ color: "var(--accent)" }} />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No screening results yet</p>
              <p className="text-sm text-gray-400 mb-4">Run AI screening to rank and shortlist candidates</p>
              <button onClick={() => setTab("screen")} className="inline-flex items-center gap-2 btn-glow text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                <Zap size={15} /> Run First Screening
              </button>
            </div>
          ) : (
            results.map((result, i) => (
              <div key={result._id} className="glass-card overflow-visible">
                {/* Result header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 accent-bg-light rounded-lg flex items-center justify-center">
                      <BarChart2 size={16} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {i === 0 ? "Latest Screening" : `Screening #${results.length - i}`} — Top {result.ranking.length}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(result.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteScreening(result._id)}
                    className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                {/* AI job summary */}
                {result.job_summary && (
                  <div className="px-6 py-3 accent-bg-light border-b border-gray-100 dark:border-white/5 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-xs font-semibold uppercase" style={{ color: "var(--accent)" }}>Must-have: </span>
                      <span className="text-gray-700 dark:text-gray-300">{result.job_summary.must_have_skills?.join(", ")}</span>
                    </div>
                    {result.job_summary.key_requirements?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold uppercase" style={{ color: "var(--accent)" }}>Key requirements: </span>
                        <span className="text-gray-700 dark:text-gray-300">{result.job_summary.key_requirements.slice(0, 3).join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <ShortlistTable ranking={result.ranking} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
