"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadMyApplications } from "../../store/slices/applicationsSlice";
import { updateMyApplication, deleteMyApplication } from "../../lib/api";
import { Application, Job } from "../../types";
import { Briefcase, MapPin, Clock, Pencil, X, Save, Trash2, FileText, ArrowRight, Paperclip, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

function AutoTextarea({ value, onChange, rows = 2, placeholder = "" }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none overflow-hidden transition-all"
    />
  );
}

const statusConfig: Record<string, { color: string; dot: string; label: string; accent: string }> = {
  pending:    { color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",  label: "Pending",     accent: "#f59e0b" },
  reviewed:   { color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",   label: "Reviewed",    accent: "#3b82f6" },
  shortlisted:{ color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-400",  label: "Shortlisted", accent: "#10b981" },
  rejected:   { color: "bg-red-50 text-red-600 border-red-200",         dot: "bg-red-400",    label: "Rejected",    accent: "#ef4444" },
};

const isPastDeadline = (job: Job | string) => typeof job !== "object" || !job.deadline ? false : new Date(job.deadline) < new Date();

export default function MyApplicationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.applications);
  const { user } = useAppSelector((s) => s.auth);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { dispatch(loadMyApplications()); }, [dispatch]);

  const startEdit = (app: Application) => {
    setEditingId(app._id);
    setCoverLetter(app.cover_letter || "");
    setAnswers(app.answers || []);
    setDocFiles({});
  };
  const cancelEdit = () => setEditingId(null);

  const handleSave = async (id: string) => {
    // Validate required questions
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i].answer?.trim()) {
        toast.error(`Please answer question ${i + 1}`);
        return;
      }
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);
      formData.append("answers", JSON.stringify(answers));
      // Append each document with its name as the field name so backend can identify it
      Object.entries(docFiles).forEach(([name, file]) => {
        formData.append(name, file, file.name);
      });
      await updateMyApplication(id, formData);
      toast.success("Application updated!");
      setEditingId(null);
      dispatch(loadMyApplications());
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Cancel this application?")) return;
    setDeleting(id);
    try {
      await deleteMyApplication(id);
      toast.success("Application cancelled");
      dispatch(loadMyApplications());
    } catch (err: any) { toast.error(err.message); }
    finally { setDeleting(null); }
  };

  if (!mounted) return null;

  if (!user) return (
    <div className="text-center py-24">
      <p className="text-gray-500 mb-4">Please sign in to view your applications.</p>
      <Link href="/auth/login" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{items.length} application{items.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Link href="/board" className="flex items-center gap-1.5 text-sm border px-4 py-2 rounded-xl hover:opacity-80 transition font-medium"
          style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
          Browse Jobs <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card text-center py-24">
          <div className="w-16 h-16 accent-bg-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} style={{ color: "var(--accent)" }} />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No applications yet</p>
          <p className="text-sm text-gray-400 mb-5">Start applying to jobs that match your skills</p>
          <Link href="/board" className="btn-glow text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Browse Open Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((app) => {
            const job = app.job_id as Job;
            const past = isPastDeadline(job);
            const isEditing = editingId === app._id;
            const sc = statusConfig[app.status] ?? statusConfig.pending;

            const isExpanded = expandedId === app._id;

            return (
              <div key={app._id} className="overflow-hidden rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, var(--accent-light) 0%, var(--card-bg, white) 50%)",
                  border: `1px solid ${sc.accent}30`,
                  borderLeftWidth: "4px",
                  borderLeftColor: sc.accent,
                }}>

                {/* Card header — always visible, click to expand */}
                <div className="p-5 cursor-pointer" onClick={() => !isEditing && setExpandedId(isExpanded ? null : app._id)}>
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 btn-glow">
                        {(typeof job === "object" ? job.title : "J").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base truncate">
                          {typeof job === "object" ? job.title : "Job"}
                        </h2>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {typeof job === "object" && job.location && (
                            <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock size={11} />Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold border ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${sc.dot}`} />{sc.label}
                      </span>
                      <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && !isEditing && (
                  <div className="px-5 pb-5 space-y-3 border-t dark:border-white/10 pt-4">
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {typeof job === "object" && job.experience_level && (
                        <span className="flex items-center gap-1"><Briefcase size={11} />{job.experience_level}</span>
                      )}
                      {typeof job === "object" && job.deadline && (
                        <span className={`flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg ${
                          past ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-green-50 text-green-600 dark:bg-green-900/20"
                        }`}>
                          <Clock size={11} />{past ? "Closed: " : "Deadline: "}{new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {app.cover_letter && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed italic border-l-2 pl-3"
                        style={{ borderColor: sc.accent }}>
                        {app.cover_letter}
                      </p>
                    )}

                    {app.answers?.length > 0 && (
                      <div className="space-y-1.5">
                        {app.answers.map((a, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{a.question}: </span>
                            <span className="text-gray-500 dark:text-gray-400">{a.answer}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {app.documents && app.documents.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((d, i) => (
                          <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            <Paperclip size={11} /> {d.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {!past && app.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(app); }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition hover:opacity-80"
                          style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(app._id); }}
                          disabled={deleting === app._id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50">
                          <Trash2 size={12} /> Cancel Application
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="border-t dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Edit Application</p>
                      <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"><X size={14} /></button>
                    </div>
                    {answers.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Application Questions</p>
                        {answers.map((a, i) => (
                          <div key={i}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{a.question}</label>
                            <AutoTextarea
                              value={a.answer}
                              onChange={(v) => { const n = [...answers]; n[i] = { ...n[i], answer: v }; setAnswers(n); }}
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Letter</label>
                      <AutoTextarea
                        value={coverLetter}
                        onChange={setCoverLetter}
                        rows={4}
                        placeholder="I'm excited to apply for this role because…"
                      />
                    </div>
                    {/* Documents re-upload */}
                    {(() => {
                      const job = app.job_id as Job;
                      const requiredDocs = typeof job === "object" ? (job as any).required_documents || [] : [];
                      if (requiredDocs.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Paperclip size={14} /> Documents</p>
                          {requiredDocs.map((doc: string | { name: string; optional: boolean }) => {
                            const docName = typeof doc === 'string' ? doc : doc.name;
                            const existing = app.documents?.find((d) => d.name === docName);
                            const newFile = docFiles[docName];
                            return (
                              <div key={docName}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{docName}</label>
                                <label className="flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition"
                                  style={{ borderColor: newFile ? "var(--accent)" : "#e5e7eb", background: newFile ? "var(--accent-light)" : "transparent" }}>
                                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setDocFiles((prev) => ({ ...prev, [docName]: file }));
                                    }} />
                                  {newFile ? (
                                    <><CheckCircle size={14} style={{ color: "var(--accent)" }} /><span className="text-xs font-medium" style={{ color: "var(--accent)" }}>{newFile.name}</span></>
                                  ) : existing ? (
                                    <><Paperclip size={14} className="text-gray-400" /><span className="text-xs text-gray-500 dark:text-gray-400">{existing.filename} <span className="text-gray-400">(click to replace)</span></span></>
                                  ) : (
                                    <><Upload size={14} className="text-gray-400" /><span className="text-xs text-gray-400">Upload {docName}</span></>
                                  )}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => handleSave(app._id)} disabled={saving}
                      className="flex items-center gap-2 btn-glow text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                    >
                      <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
