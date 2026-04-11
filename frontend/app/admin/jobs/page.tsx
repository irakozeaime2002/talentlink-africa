"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetJobs, adminDeleteJob, adminUpdateJobStatus } from "../../../lib/api";
import toast from "react-hot-toast";
import { Search, Trash2, MapPin, Briefcase, Clock } from "lucide-react";

interface Job { _id: string; title: string; organization?: string; status: string; location?: string; experience_level: string; deadline?: string; recruiter_id?: { name: string; email: string }; required_skills: string[]; createdAt: string; }

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  closed: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

export default function AdminJobsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, search, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetJobs({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined });
      setJobs(data.jobs); setTotal(data.total);
    } catch { toast.error("Failed to load jobs"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.title}"? This will also delete all applications and screening results.`)) return;
    try { await adminDeleteJob(job._id); toast.success("Job deleted"); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await adminUpdateJobStatus(id, status); toast.success(`Status updated to ${status}`); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total jobs</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or organization..."
            className="w-full border dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
        </div>
        {["all", "open", "draft", "closed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition capitalize ${statusFilter === s ? "border-transparent text-white btn-glow" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-40 animate-pulse" />) :
          jobs.map((job) => (
            <div key={job._id} className="glass-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{job.title}</p>
                  {job.organization && <p className="text-xs text-gray-400">{job.organization}</p>}
                  {job.recruiter_id && <p className="text-xs text-gray-400 mt-0.5">By: {job.recruiter_id.name} ({job.recruiter_id.email})</p>}
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[job.status]}`}>{job.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                <span className="flex items-center gap-1"><Briefcase size={11} />{job.experience_level}</span>
                {job.deadline && <span className="flex items-center gap-1"><Clock size={11} />{new Date(job.deadline).toLocaleDateString()}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {job.required_skills?.slice(0, 4).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{s}</span>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t dark:border-white/10">
                {["open", "draft", "closed"].filter((s) => s !== job.status).map((s) => (
                  <button key={s} onClick={() => handleStatus(job._id, s)}
                    className="flex-1 text-xs py-1.5 rounded-lg border dark:border-white/10 text-gray-500 hover:opacity-80 transition capitalize">
                    Set {s}
                  </button>
                ))}
                <button onClick={() => handleDelete(job)} className="px-3 py-1.5 rounded-lg text-xs text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
