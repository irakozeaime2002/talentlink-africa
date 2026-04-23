"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../store/hooks";
import { Application, Candidate, User } from "../../types";
import { Users, ChevronRight, Upload, Mail, Send, ChevronDown } from "lucide-react";
import * as api from "../../lib/api";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  pending:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  border: "border-amber-200" },
  reviewed:    { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400",   border: "border-blue-200" },
  shortlisted: { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  border: "border-green-200" },
  rejected:    { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400",    border: "border-red-200" },
};

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600", "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",  "from-sky-500 to-cyan-600",
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

type Entry =
  | { type: "application"; _id: string; data: Application }
  | { type: "candidate";   _id: string; data: Candidate };

export default function ApplicationsPanel({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState("all");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const DEFAULT_MESSAGES: Record<string, string> = {
    all:         `We wanted to reach out regarding your application. Thank you for your interest and for taking the time to apply. Our team is actively reviewing all submissions and we will be in touch with an update soon.`,
    shortlisted: `We are pleased to inform you that after carefully reviewing your application, you have been shortlisted for the next stage of our selection process. Our team was impressed with your profile and we look forward to learning more about you. We will be in touch shortly with details about the next steps.`,
    reviewed:    `Thank you for your patience. We have reviewed your application and your profile is currently under consideration. We appreciate the time and effort you put into your application and will update you as our process moves forward.`,
    rejected:    `Thank you for your interest and for taking the time to apply. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future opportunities that match your skills and experience.`,
    pending:     `We have successfully received your application. Our team will review your profile and get back to you with an update. Thank you for your interest in joining our team.`,
  };

  useEffect(() => {
    api.fetchAllJobEntries(jobId)
      .then((data) => {
        console.log("[ApplicationsPanel] entries:", data);
        setEntries(data as Entry[]);
      })
      .catch((err) => {
        console.error("[ApplicationsPanel] fetch error:", err);
        toast.error("Failed to load applications");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const appCount = entries.filter((e) => e.type === "application").length;

  const handleBulkEmail = async () => {
    setEmailSending(true);
    try {
      const result = await api.sendBulkEmail(jobId, emailStatus, emailMessage || undefined);
      toast.success(`Sent to ${result.sent} candidate${result.sent !== 1 ? "s" : ""}${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
      setEmailOpen(false);
      setEmailMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send emails");
    } finally {
      setEmailSending(false);
    }
  };
  const candidateCount = entries.filter((e) => e.type === "candidate").length;
  const shortlisted = entries.filter((e) => {
    const status = e.type === "application" ? (e.data as Application).status : (e.data as Candidate).status;
    return status === "shortlisted";
  }).length;
  const pending = entries.filter((e) => {
    const status = e.type === "application" ? (e.data as Application).status : (e.data as Candidate).status;
    return status === "pending";
  }).length;

  if (loading) return (
    <div className="text-center py-8">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-400">Loading applications...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Applications</h2>
        <div className="flex gap-2 text-xs font-medium flex-wrap">
          <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">{entries.length} total</span>
          {candidateCount > 0 && <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2.5 py-1 rounded-full flex items-center gap-1"><Upload size={10} />{candidateCount} imported</span>}
          {shortlisted > 0 && <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">{shortlisted} shortlisted</span>}
          {pending > 0 && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">{pending} pending</span>}
        </div>
      </div>

      {/* Bulk Email Panel */}
      {entries.length > 0 && (
        <div className="mb-4 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => { if (!emailOpen) setEmailMessage(DEFAULT_MESSAGES[emailStatus]); setEmailOpen(!emailOpen); }}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-2"><Mail size={15} /> Send Email to Candidates</span>
            <ChevronDown size={15} className={`transition-transform ${emailOpen ? "rotate-180" : ""}`} />
          </button>
          {emailOpen && (
            <div className="p-4 space-y-3 bg-white dark:bg-white/5">
              <div className="flex flex-wrap gap-2">
                {(["all", "shortlisted", "reviewed", "pending", "rejected"] as const).map((s) => (
                  <button key={s} onClick={() => { setEmailStatus(s); setEmailMessage(DEFAULT_MESSAGES[s]); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition ${
                      emailStatus === s
                        ? s === "shortlisted" ? "bg-green-100 text-green-700 border-green-300"
                          : s === "reviewed" ? "bg-blue-100 text-blue-700 border-blue-300"
                          : s === "rejected" ? "bg-red-100 text-red-600 border-red-300"
                          : s === "pending" ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10 hover:border-indigo-300"
                    }`}>
                    {s === "all" ? "All Candidates" : s}
                  </button>
                ))}
              </div>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Message..."
                rows={5}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Will send to <strong>{emailStatus === "all" ? entries.length : entries.filter(e => {
                    const s = e.type === "application" ? (e.data as Application).status : (e.data as Candidate).status || "pending";
                    return s === emailStatus;
                  }).length}</strong> candidate(s)
                </p>
                <button onClick={handleBulkEmail} disabled={emailSending}
                  className="flex items-center gap-2 btn-glow text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 transition">
                  <Send size={13} />{emailSending ? "Sending…" : "Send Emails"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">No applications yet</p>
          <p className="text-sm mt-1">Share the job link or import candidates via CSV/PDF</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {entries.map((entry) => {
            if (entry.type === "application") {
              const app = entry.data as Application;
              const applicant = app.applicant_id as User;
              const name = typeof applicant === "object" ? applicant.name : "Applicant";
              const email = typeof applicant === "object" ? applicant.email : "";
              const cfg = STATUS_CONFIG[app.status];
              return (
                <button key={entry._id} onClick={() => router.push(`/applications/${app._id}`)}
                  className="w-full text-left bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                      {name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{name}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} capitalize`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{app.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{email}</p>
                      {app.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.skills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">{typeof s === "string" ? s : s.name}</span>
                          ))}
                          {app.skills.length > 4 && <span className="text-xs text-gray-400">+{app.skills.length - 4}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                        <p className="text-xs text-indigo-500 font-medium mt-0.5">View →</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                </button>
              );
            }

            // CSV / resume candidate
            const c = entry.data as Candidate;
            const status = c.status || "pending";
            const cfg = STATUS_CONFIG[status];
            return (
              <button key={entry._id} onClick={() => router.push(`/candidates/${c._id}`)}
                className="w-full text-left bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 hover:border-sky-300 hover:shadow-md transition-all duration-150 group">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient(c.name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                    {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-sky-600 transition-colors">{c.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} capitalize`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{status}
                      </span>
                      <span className="text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full uppercase">{c.source}</span>
                    </div>
                    {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                    {c.headline && <p className="text-xs text-gray-500 truncate mt-0.5">{c.headline}</p>}
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.skills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 px-2 py-0.5 rounded-full">{s.name}</span>
                        ))}
                        {c.skills.length > 4 && <span className="text-xs text-gray-400">+{c.skills.length - 4}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <p className="text-xs text-sky-500 font-medium">View →</p>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-sky-400 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
