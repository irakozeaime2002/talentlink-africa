"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Candidate } from "../../../types";
import * as api from "../../../lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Briefcase, GraduationCap, FolderGit2, Award,
  CheckCircle2, MapPin, Mail, ExternalLink, FileText,
  Languages, Globe, Linkedin, Github, Twitter, Calendar, Upload, Send,
} from "lucide-react";

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

function Section({ icon, title, color = "text-indigo-500", children }: {
  icon: React.ReactNode; title: string; color?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className={color}>{icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const DEFAULT_MESSAGES: Record<string, string> = {
    shortlisted: `We are pleased to inform you that after carefully reviewing your application, you have been shortlisted for the next stage of our selection process. Our team was impressed with your profile and we look forward to learning more about you. We will be in touch shortly with details about the next steps.`,
    reviewed: `Thank you for your patience. We have reviewed your application and your profile is currently under consideration. We appreciate the time and effort you put into your application and will update you as our process moves forward.`,
    rejected: `Thank you for your interest and for taking the time to apply. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future opportunities that match your skills and experience.`,
    pending: `We have successfully received your application. Our team will review your profile and get back to you with an update. Thank you for your interest in joining our team.`,
  };

  useEffect(() => {
    api.fetchCandidate(id)
      .then(setCandidate)
      .catch(() => toast.error("Failed to load candidate"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: string) => {
    if (!candidate) return;
    setStatusUpdating(true);
    try {
      await api.updateCandidateStatus(candidate._id, status);
      setCandidate({ ...candidate, status: status as Candidate["status"] });
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
    finally { setStatusUpdating(false); }
  };

  const handleSendEmail = async () => {
    if (!candidate?.email) return;
    setEmailSending(true);
    try {
      await api.sendSingleEmail(candidate.email, candidate.name, "the position", candidate.status || "pending", emailMessage || undefined);
      toast.success("Email sent successfully");
      setEmailOpen(false);
      setEmailMessage("");
    } catch { toast.error("Failed to send email"); }
    finally { setEmailSending(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse pt-6">
      <div className="h-6 bg-gray-100 rounded-xl w-1/4" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!candidate) return (
    <div className="text-center py-20 text-gray-400"><p>Candidate not found.</p></div>
  );

  const status = candidate.status || "pending";
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        <div className="relative">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 65%)" }} />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start gap-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(candidate.name)} flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shrink-0`}>
                {candidate.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-white mb-1">{candidate.name}</h1>
                {candidate.headline && <p className="text-sm text-sky-200 mb-2 font-medium">{candidate.headline}</p>}
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  {candidate.email && <span className="flex items-center gap-1.5 text-sky-300"><Mail size={13} />{candidate.email}</span>}
                  {candidate.location && <span className="flex items-center gap-1.5 text-violet-300"><MapPin size={13} />{candidate.location}</span>}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20 capitalize">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 uppercase">
                    <Upload size={11} />{candidate.source}
                  </span>
                </div>
              </div>
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-xl border border-white/20 transition">
                  <ExternalLink size={13} /> Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status update */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
        <div className="grid grid-cols-4 gap-2">
          {(["pending", "reviewed", "shortlisted", "rejected"] as const).map((s) => {
            const c = STATUS_CONFIG[s];
            const active = status === s;
            return (
              <button key={s} onClick={() => handleStatus(s)} disabled={statusUpdating}
                className={`py-2.5 rounded-xl text-xs font-bold capitalize transition border ${
                  active ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Send Email */}
      {candidate.email && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <button onClick={() => { if (!emailOpen) setEmailMessage(DEFAULT_MESSAGES[status] || ""); setEmailOpen(!emailOpen); }}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-2"><Mail size={15} /> Send Email to Candidate</span>
            <span className="text-xs text-gray-400">{candidate.email}</span>
          </button>
          {emailOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 pt-3">A <strong className={`${cfg.text} capitalize`}>{status}</strong> status email will be sent. Edit the message below or leave as-is.</p>
              <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Message..."
                rows={5}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <button onClick={handleSendEmail} disabled={emailSending}
                className="flex items-center gap-2 btn-glow text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 transition">
                <Send size={13} />{emailSending ? "Sending…" : "Send Email"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {candidate.bio && (
        <Section icon={<FileText size={18} />} title="About" color="text-indigo-500">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{candidate.bio}</p>
        </Section>
      )}

      {/* Availability */}
      {candidate.availability && (candidate.availability.status || candidate.availability.type) && (
        <Section icon={<Calendar size={18} />} title="Availability" color="text-teal-500">
          <div className="flex flex-wrap gap-3">
            {candidate.availability.status && (
              <span className="text-sm bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-full font-medium">{candidate.availability.status}</span>
            )}
            {candidate.availability.type && (
              <span className="text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full font-medium">{candidate.availability.type}</span>
            )}
            {candidate.availability.startDate && (
              <span className="text-sm bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                Available from {new Date(candidate.availability.startDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Social Links */}
      {candidate.socialLinks && Object.keys(candidate.socialLinks).length > 0 && (
        <Section icon={<Globe size={18} />} title="Social & Professional Links" color="text-sky-500">
          <div className="flex flex-wrap gap-2">
            {Object.entries(candidate.socialLinks).map(([platform, url]) => {
              const lower = platform.toLowerCase();
              const icon = lower.includes("linkedin") ? <Linkedin size={14} /> : lower.includes("github") ? <Github size={14} /> : lower.includes("twitter") ? <Twitter size={14} /> : <ExternalLink size={14} />;
              return (
                <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1.5 rounded-full font-medium hover:bg-sky-100 transition capitalize">
                  {icon}{platform}
                </a>
              );
            })}
          </div>
        </Section>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <Section icon={<Languages size={18} />} title="Languages" color="text-purple-500">
          <div className="flex flex-wrap gap-2">
            {candidate.languages.map((l, i) => (
              <span key={i} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full font-medium">
                {l.name}{l.proficiency && ` · ${l.proficiency}`}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {candidate.skills?.length > 0 && (
        <Section icon={<CheckCircle2 size={18} />} title="Skills" color="text-indigo-500">
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((s, i) => (
              <span key={i} className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full font-medium">
                {s.name}{s.level && ` · ${s.level}`}{s.yearsOfExperience ? ` · ${s.yearsOfExperience}y` : ""}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {candidate.experience?.length > 0 && (
        <Section icon={<Briefcase size={18} />} title="Work Experience" color="text-blue-500">
          <div className="space-y-3">
            {candidate.experience.map((e, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-bold text-gray-900">{e.role}</p>
                    <p className="text-sm text-indigo-600 font-medium">{e.company}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-white border px-2.5 py-1 rounded-full shrink-0">
                    {e.startDate && new Date(e.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    {" – "}
                    {e.isCurrent ? "Present" : e.endDate ? new Date(e.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                  </span>
                </div>
                {e.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{e.description}</p>}
                {e.technologies && e.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.technologies.map((t, idx) => <span key={idx} className="text-xs bg-white border px-2.5 py-0.5 rounded-full text-gray-600">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {candidate.education?.length > 0 && (
        <Section icon={<GraduationCap size={18} />} title="Education" color="text-emerald-500">
          <div className="space-y-3">
            {candidate.education.map((e, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{e.degree}{e.fieldOfStudy && ` in ${e.fieldOfStudy}`}</p>
                  <p className="text-sm text-gray-500">
                    {e.institution}{(e.startYear || e.endYear) && ` · ${e.startYear || ""}${e.startYear && e.endYear ? "–" : ""}${e.endYear || ""}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {candidate.projects?.length > 0 && (
        <Section icon={<FolderGit2 size={18} />} title="Projects" color="text-violet-500">
          <div className="space-y-3">
            {candidate.projects.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-bold text-gray-900">{p.name}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 shrink-0">
                      <ExternalLink size={11} /> View
                    </a>
                  )}
                </div>
                {p.role && <p className="text-xs text-gray-500 mb-1">Role: {p.role}</p>}
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{p.description}</p>
                {p.technologies && p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.map((t, idx) => <span key={idx} className="text-xs bg-white border px-2.5 py-0.5 rounded-full text-gray-600">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {candidate.certifications?.length > 0 && (
        <Section icon={<Award size={18} />} title="Certifications" color="text-amber-500">
          <div className="space-y-2">
            {candidate.certifications.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                <Award size={14} className="text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">{c.name}</p>
                  {c.issuer && <p className="text-xs text-amber-700">{c.issuer}{c.issueDate && ` · ${new Date(c.issueDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CV Text */}
      {candidate.cv_data && (
        <Section icon={<FileText size={18} />} title="Resume / CV" color="text-rose-500">
          <div className="max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{candidate.cv_data.slice(0, 3000)}{candidate.cv_data.length > 3000 ? "\n…" : ""}</p>
          </div>
        </Section>
      )}
    </div>
  );
}
