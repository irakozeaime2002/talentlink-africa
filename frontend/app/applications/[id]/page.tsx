"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { changeApplicationStatus } from "../../../store/slices/applicationsSlice";
import { fetchApplicantProfile, fetchApplicantUser } from "../../../lib/api";
import { Application, Candidate, User } from "../../../types";
import toast from "react-hot-toast";
import {
  ArrowLeft, Briefcase, GraduationCap, FolderGit2, Award,
  MessageSquare, FileText, CheckCircle2, Phone, MapPin,
  Calendar, User as UserIcon, Hash, Mail, ExternalLink, Paperclip, Download,
  Languages, Globe, Linkedin, Github, Twitter,
} from "lucide-react";
import * as api from "../../../lib/api";
import axios from "axios";
import Cookies from "js-cookie";

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

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [app, setApp] = useState<Application | null>(null);
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [applicantUser, setApplicantUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    // Wait for user to be loaded from auth state
    if (!user) return;
    
    const token = Cookies.get("token");
    if (!token) {
      setLoading(false);
      return;
    }
    
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/applications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        const data: Application = r.data;
        setApp(data);
        const applicantId = typeof data.applicant_id === "object" ? (data.applicant_id as User)._id : data.applicant_id;
        // Only fetch full profile if user is a recruiter
        if (applicantId && user?.role === "recruiter") {
          fetchApplicantProfile(applicantId)
            .then(setProfile)
            .catch((err) => {
              console.error("Failed to fetch applicant profile:", err);
            });
          fetchApplicantUser(applicantId)
            .then(setApplicantUser)
            .catch((err) => {
              console.error("Failed to fetch applicant user:", err);
            });
        }
        setLoading(false);
      })
      .catch((err) => { 
        console.error("Failed to fetch application:", err);
        setLoading(false); 
      });
  }, [id, user]);

  const handleStatus = async (status: string) => {
    if (!app) return;
    setStatusUpdating(true);
    try {
      await dispatch(changeApplicationStatus({ id: app._id, status })).unwrap();
      setApp({ ...app, status: status as Application["status"] });
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
    finally { setStatusUpdating(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse pt-6">
      <div className="h-6 bg-gray-100 rounded-xl w-1/4" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!app) return (
    <div className="text-center py-20 text-gray-400">
      <p>Application not found.</p>
    </div>
  );

  const applicant = app.applicant_id as User;
  const name = typeof applicant === "object" ? applicant.name : "Applicant";
  const email = typeof applicant === "object" ? applicant.email : "";
  const cfg = STATUS_CONFIG[app.status];

  const skills = profile?.skills?.length ? profile.skills : app.skills;
  const experience = profile?.experience?.length ? profile.experience : app.experience;
  const education = profile?.education?.length ? profile.education : app.education;
  const projects = profile?.projects?.length ? profile.projects : app.projects;
  const certifications = profile?.certifications?.length ? profile.certifications : app.certifications;
  const languages = profile?.languages || [];
  const headline = profile?.headline || "";
  const bio = profile?.bio || "";
  const profileLocation = profile?.location || "";
  const availability = profile?.availability;
  const socialLinks = profile?.socialLinks || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        <div className="absolute-blobs relative">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 65%)" }} />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shrink-0`}>
                {name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-white mb-1">{name}</h1>
                {headline && <p className="text-sm text-sky-200 mb-2 font-medium">{headline}</p>}
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="flex items-center gap-1.5 text-sky-300"><Mail size={13} />{email}</span>
                  {applicantUser?.phone && <span className="flex items-center gap-1.5 text-emerald-300"><Phone size={13} />{applicantUser.phone}</span>}
                  {(applicantUser?.residence || profileLocation) && <span className="flex items-center gap-1.5 text-violet-300"><MapPin size={13} />{applicantUser?.residence || profileLocation}</span>}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20 capitalize`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{app.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Applied {new Date(app.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {email && (
                <a href={`mailto:${email}`} className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-xl border border-white/20 transition">
                  <ExternalLink size={13} /> Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status update — recruiter only */}
      {user?.role === "recruiter" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Application Status</p>
          <div className="grid grid-cols-4 gap-2">
            {(["pending", "reviewed", "shortlisted", "rejected"] as const).map((s) => {
              const c = STATUS_CONFIG[s];
              const active = app.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  disabled={statusUpdating}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize transition border ${
                    active ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <Section icon={<UserIcon size={18} />} title="About" color="text-indigo-500">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{bio}</p>
        </Section>
      )}

      {/* Availability */}
      {availability && (availability.status || availability.type || availability.startDate) && (
        <Section icon={<Calendar size={18} />} title="Availability" color="text-teal-500">
          <div className="flex flex-wrap gap-3">
            {availability.status && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-full font-medium">
                {availability.status}
              </span>
            )}
            {availability.type && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full font-medium">
                {availability.type}
              </span>
            )}
            {availability.startDate && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                Available from {new Date(availability.startDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Social Links */}
      {Object.keys(socialLinks).length > 0 && (
        <Section icon={<Globe size={18} />} title="Social & Professional Links" color="text-sky-500">
          <div className="flex flex-wrap gap-2">
            {Object.entries(socialLinks).map(([platform, url]) => {
              const getIcon = () => {
                const lower = platform.toLowerCase();
                if (lower.includes('linkedin')) return <Linkedin size={14} />;
                if (lower.includes('github') || lower.includes('git')) return <Github size={14} />;
                if (lower.includes('twitter') || lower.includes('x')) return <Twitter size={14} />;
                return <ExternalLink size={14} />;
              };
              return (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1.5 rounded-full font-medium hover:bg-sky-100 transition"
                >
                  {getIcon()}
                  <span className="capitalize">{platform}</span>
                </a>
              );
            })}
          </div>
        </Section>
      )}

      {/* Personal info */}
      {applicantUser && (applicantUser.date_of_birth || applicantUser.gender || applicantUser.nationality || applicantUser.national_id || applicantUser.father_name || applicantUser.mother_name) && (
        <Section icon={<UserIcon size={18} />} title="Personal Information" color="text-violet-500">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {applicantUser.date_of_birth && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Calendar size={11} /> Date of Birth</p>
                <p className="text-sm font-semibold text-gray-800">{new Date(applicantUser.date_of_birth).toLocaleDateString()}</p>
              </div>
            )}
            {applicantUser.gender && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Gender</p>
                <p className="text-sm font-semibold text-gray-800">{applicantUser.gender}</p>
              </div>
            )}
            {applicantUser.nationality && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Nationality</p>
                <p className="text-sm font-semibold text-gray-800">{applicantUser.nationality}</p>
              </div>
            )}
            {applicantUser.national_id && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2">
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Hash size={11} /> National ID</p>
                <p className="text-sm font-semibold text-gray-800">{applicantUser.national_id}</p>
              </div>
            )}
            {(applicantUser.father_name || applicantUser.mother_name) && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2 md:col-span-3">
                <p className="text-xs text-gray-400 mb-1">Family</p>
                <div className="flex gap-6">
                  {applicantUser.father_name && <p className="text-sm text-gray-800">Father: <span className="font-semibold">{applicantUser.father_name}</span></p>}
                  {applicantUser.mother_name && <p className="text-sm text-gray-800">Mother: <span className="font-semibold">{applicantUser.mother_name}</span></p>}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <Section icon={<Languages size={18} />} title="Languages" color="text-purple-500">
          <div className="flex flex-wrap gap-2">
            {languages.map((lang, i) => (
              <span key={i} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full font-medium">
                {lang.name}{lang.proficiency && ` · ${lang.proficiency}`}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills?.length > 0 && (
        <Section icon={<CheckCircle2 size={18} />} title="Skills" color="text-indigo-500">
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full font-medium">
                {s.name}{s.level && ` · ${s.level}`}{s.yearsOfExperience && ` · ${s.yearsOfExperience}y`}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <Section icon={<Briefcase size={18} />} title="Work Experience" color="text-blue-500">
          <div className="space-y-3">
            {experience.map((e, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-bold text-gray-900">{e.role}</p>
                    <p className="text-sm text-indigo-600 font-medium">{e.company}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-white border px-2.5 py-1 rounded-full shrink-0">
                    {e.startDate && new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' - '}
                    {e.isCurrent ? 'Present' : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A')}
                  </span>
                </div>
                {e.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{e.description}</p>}
                {e.technologies && e.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.technologies.map((t, idx) => (
                      <span key={idx} className="text-xs bg-white border px-2.5 py-0.5 rounded-full text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <Section icon={<GraduationCap size={18} />} title="Education" color="text-emerald-500">
          <div className="space-y-3">
            {education.map((e, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{e.degree}{e.fieldOfStudy && ` in ${e.fieldOfStudy}`}</p>
                  <p className="text-sm text-gray-500">
                    {e.institution}
                    {(e.startYear || e.endYear) && ` · ${e.startYear || ''}${e.startYear && e.endYear ? '-' : ''}${e.endYear || ''}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <Section icon={<FolderGit2 size={18} />} title="Projects" color="text-violet-500">
          <div className="space-y-3">
            {projects.map((p, i) => (
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
                    {p.technologies.map((t, idx) => (
                      <span key={idx} className="text-xs bg-white border px-2.5 py-0.5 rounded-full text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <Section icon={<Award size={18} />} title="Certifications" color="text-amber-500">
          <div className="space-y-2">
            {certifications.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                <Award size={14} className="text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">{c.name}</p>
                  {c.issuer && <p className="text-xs text-amber-700">{c.issuer}{c.issueDate && ` · ${new Date(c.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Application Questions */}
      {app.answers?.filter((a) => a.answer).length > 0 && (
        <Section icon={<MessageSquare size={18} />} title="Application Questions" color="text-sky-500">
          <div className="space-y-4">
            {app.answers.filter((a) => a.answer).map((a, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{a.question}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{a.answer}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents */}
      {app.documents && app.documents.length > 0 && (
        <Section icon={<Paperclip size={18} />} title="Submitted Documents" color="text-teal-500">
          <div className="space-y-2">
            {app.documents.map((doc, i) => {
              const openDoc = () => {
                if (!doc.data) return;
                const ext = doc.filename.split(".").pop()?.toLowerCase();
                const mimeMap: Record<string, string> = {
                  pdf: "application/pdf",
                  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
                  doc: "application/msword",
                  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                };
                const mime = mimeMap[ext || ""] || "application/octet-stream";
                const binary = atob(doc.data);
                const bytes = new Uint8Array(binary.length);
                for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                const blob = new Blob([bytes], { type: mime });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
              };
              return (
                <div key={i} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-light)" }}>
                      <Paperclip size={15} style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{doc.name}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.filename}</p>
                    </div>
                  </div>
                  <button onClick={openDoc} disabled={!doc.data}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                    title="Open document">
                    <Download size={13} /> Open
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Cover Letter */}
      {app.cover_letter && (
        <Section icon={<FileText size={18} />} title="Cover Letter" color="text-rose-500">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{app.cover_letter}</p>
        </Section>
      )}
    </div>
  );
}
