"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadMyApplications } from "../../store/slices/applicationsSlice";
import { updateMyApplication, deleteMyApplication } from "../../lib/api";
import { Application, Job } from "../../types";
import { Briefcase, MapPin, Clock, Pencil, X, Save, Trash2, FileText, ArrowRight, Paperclip, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  pending:    { color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",  label: "Pending" },
  reviewed:   { color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",   label: "Reviewed" },
  shortlisted:{ color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-400",  label: "Shortlisted" },
  rejected:   { color: "bg-red-50 text-red-600 border-red-200",         dot: "bg-red-400",    label: "Rejected" },
};

const isPastDeadline = (job: Job | string) => typeof job !== "object" || !job.deadline ? false : new Date(job.deadline) < new Date();

export default function MyApplicationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.applications);
  const { user } = useAppSelector((s) => s.auth);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { dispatch(loadMyApplications()); }, [dispatch]);

  const startEdit = (app: Application) => {
    setEditingId(app._id);
    setCoverLetter(app.cover_letter || "");
    setAnswers(app.answers || []);
    setDocFiles({});
  };
  const cancelEdit = () => setEditingId(null);

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("cover_letter", coverLetter);
      formData.append("answers", JSON.stringify(answers));
      Object.entries(docFiles).forEach(([name, file]) => {
        formData.append("documents", file, file.name);
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
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} application{items.length !== 1 ? "s" : ""} submitted</p>
        </div>
        <Link href="/board" className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition font-medium">
          Browse Jobs <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-indigo-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No applications yet</p>
          <p className="text-sm text-gray-400 mb-5">Start applying to jobs that match your skills</p>
          <Link href="/board" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Browse Open Jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((app) => {
            const job = app.job_id as Job;
            const past = isPastDeadline(job);
            const isEditing = editingId === app._id;
            const sc = statusConfig[app.status] ?? statusConfig.pending;

            return (
              <div key={app._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-gray-900 text-base truncate">{typeof job === "object" ? job.title : "Job"}</h2>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1.5">
                        {typeof job === "object" && job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                        {typeof job === "object" && job.experience_level && <span className="flex items-center gap-1"><Briefcase size={11} />{job.experience_level}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} />Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        {typeof job === "object" && job.deadline && (
                          <span className={`flex items-center gap-1 font-medium ${past ? "text-red-400" : "text-green-600"}`}>
                            <Clock size={11} />Deadline: {new Date(job.deadline).toLocaleDateString()}{past ? " (closed)" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                      {!past && app.status === "pending" && !isEditing && (
                        <>
                          <button onClick={() => startEdit(app)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(app._id)} disabled={deleting === app._id} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Cancel">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      {isEditing && <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={14} /></button>}
                    </div>
                  </div>

                  {past && !isEditing && (
                    <p className="text-xs text-red-400 mt-2">Deadline passed — editing unavailable.</p>
                  )}

                  {!isEditing && (
                    <>
                      {app.cover_letter && <p className="text-sm text-gray-500 line-clamp-2 mt-3 leading-relaxed">{app.cover_letter}</p>}
                      {app.answers?.length > 0 && (
                        <div className="mt-3 space-y-1 border-t pt-3">
                          {app.answers.map((a, i) => (
                            <p key={i} className="text-xs text-gray-500"><span className="font-medium text-gray-700">{a.question}:</span> {a.answer}</p>
                          ))}
                        </div>
                      )}
                      {app.documents && app.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                          {app.documents.map((d, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border"
                              style={{ background: "var(--accent-light)", color: "var(--accent)", borderColor: "var(--accent-light)" }}>
                              <Paperclip size={11} /> {d.name}: {d.filename}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {isEditing && (
                  <div className="border-t bg-gray-50 p-5 space-y-4">
                    {answers.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Application Questions</p>
                        {answers.map((a, i) => (
                          <div key={i}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{a.question}</label>
                            <textarea
                              value={a.answer}
                              onChange={(e) => { const n = [...answers]; n[i] = { ...n[i], answer: e.target.value }; setAnswers(n); }}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                        rows={4}
                      />
                    </div>
                    {/* Documents re-upload */}
                    {(() => {
                      const job = app.job_id as Job;
                      const requiredDocs = typeof job === "object" ? (job as any).required_documents || [] : [];
                      if (requiredDocs.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Paperclip size={14} /> Documents</p>
                          {requiredDocs.map((docName: string) => {
                            const existing = app.documents?.find((d) => d.name === docName);
                            const newFile = docFiles[docName];
                            return (
                              <div key={docName}>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">{docName}</label>
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
                                    <><Paperclip size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{existing.filename} <span className="text-gray-400">(click to replace)</span></span></>
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
                      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
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
