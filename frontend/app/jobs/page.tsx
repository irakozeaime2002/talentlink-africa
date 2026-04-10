"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadJobs, removeJob } from "../../store/slices/jobsSlice";
import toast from "react-hot-toast";
import { MapPin, Clock, Briefcase, Plus, Trash2, Edit, Eye, FileText, Users, DollarSign } from "lucide-react";

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  open:   { label: "Open",   dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  draft:  { label: "Draft",  dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  closed: { label: "Closed", dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400" },
};

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.jobs);

  useEffect(() => { dispatch(loadJobs()); }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await dispatch(removeJob(id));
    toast.success("Job deleted");
  };

  const open   = items.filter((j) => j.status === "open").length;
  const draft  = items.filter((j) => j.status === "draft").length;
  const closed = items.filter((j) => j.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">My Jobs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {items.length} total &nbsp;·&nbsp;
            <span className="text-emerald-600 font-medium">{open} open</span> &nbsp;·&nbsp;
            <span className="text-amber-600 font-medium">{draft} draft</span> &nbsp;·&nbsp;
            <span className="text-gray-400">{closed} closed</span>
          </p>
        </div>
        <Link href="/jobs/new" className="btn-glow flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={16} /> New Job
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
              <div className="h-10 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="flex gap-2">
                {[...Array(3)].map((_, j) => <div key={j} className="h-6 bg-gray-100 dark:bg-white/5 rounded-full w-16" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="glass-card text-center py-24">
          <div className="w-16 h-16 accent-icon-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-white" />
          </div>
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">No jobs yet</p>
          <p className="text-sm text-gray-400 mb-6">Create your first job listing to start receiving applications</p>
          <Link href="/jobs/new" className="btn-glow inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            <Plus size={15} /> Create First Job
          </Link>
        </div>
      )}

      {/* Job cards */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((job) => {
            const sc = statusConfig[job.status] || statusConfig.closed;
            const isExpired = job.deadline && new Date(job.deadline) < new Date();
            return (
              <div key={job._id} className="glass-card p-0 overflow-hidden group flex flex-col">
                {/* Top accent bar */}
                <div className="h-1 w-full" style={{ background: "var(--accent)" }} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base truncate group-hover:opacity-80 transition">
                        {job.title}
                      </h3>
                      {job.organization && (
                        <p className="text-xs text-gray-400 mt-0.5">{job.organization}</p>
                      )}
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {job.location && (
                      <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    )}
                    {job.experience_level && (
                      <span className="flex items-center gap-1"><Briefcase size={11} />{job.experience_level}</span>
                    )}
                    {job.salary_range && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <DollarSign size={11} />RWF {job.salary_range}
                      </span>
                    )}
                    {job.deadline && (
                      <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : ""}`}>
                        <Clock size={11} />
                        {isExpired ? "Expired " : "Deadline: "}
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">
                    {job.description}
                  </p>

                  {/* Skills */}
                  {job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.required_skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                          {s}
                        </span>
                      ))}
                      {job.required_skills.length > 4 && (
                        <span className="text-xs text-gray-400 px-2 py-1">+{job.required_skills.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {job.application_questions?.length > 0 && (
                      <span>{job.application_questions.length} question{job.application_questions.length !== 1 ? "s" : ""}</span>
                    )}
                    {job.responsibilities?.length > 0 && (
                      <span>{job.responsibilities.length} responsibilit{job.responsibilities.length !== 1 ? "ies" : "y"}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t dark:border-white/10">
                    <Link href={`/jobs/${job._id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      <Eye size={13} /> View
                    </Link>
                    <Link href={`/jobs/${job._id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 py-2 rounded-xl transition">
                      <Edit size={13} /> Edit
                    </Link>
                    <button onClick={() => handleDelete(job._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 py-2 rounded-xl transition">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
