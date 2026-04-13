"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetJobs, adminDeleteJob, adminUpdateJobStatus } from "../../../lib/api";
import toast from "react-hot-toast";
import { Search, Trash2, MapPin, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

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
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? [...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-4 h-24 animate-pulse" />
        )) : jobs.map((job) => (
          <div key={job._id} className="glass-card overflow-hidden">
            <div className="h-0.5 w-full btn-glow" />
            <div className="p-3 space-y-2.5">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <Link href={`/board/${job._id}`}
                  className="font-semibold text-sm truncate hover:underline"
                  style={{ color: "var(--accent)" }}>
                  {job.title}
                </Link>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[job.status]}`}>
                  {job.status}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                {job.recruiter_id && <span className="truncate">{job.recruiter_id.name}</span>}
                {job.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{job.location}</span>}
                {job.deadline && <span className="flex items-center gap-0.5"><Clock size={9} />{new Date(job.deadline).toLocaleDateString()}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1 border-t dark:border-white/10">
                <Link href={`/board/${job._id}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold btn-glow text-white">
                  <ExternalLink size={10} /> View
                </Link>
                <div className="flex gap-1 flex-1">
                  {["open", "draft", "closed"].filter((s) => s !== job.status).map((s) => (
                    <button key={s} onClick={() => handleStatus(job._id, s)}
                      className="flex-1 text-xs py-1 rounded-lg border dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition capitalize">
                      {s}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleDelete(job)}
                  className="p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
