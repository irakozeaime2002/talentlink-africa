"use client";
import { useState, useEffect, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateProfile } from "../../store/slices/authSlice";
import { loadMyApplications } from "../../store/slices/applicationsSlice";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Job, User } from "../../types";
import { fetchMyProfile, updateMyProfile, uploadMyCV } from "../../lib/api";
import { Plus, Minus, Save, Paperclip, Upload, User as UserIcon, Briefcase, GraduationCap, FolderGit2, Phone, ArrowLeft } from "lucide-react";

type ExpEntry = { title: string; company: string; duration: string; description: string };
type EduEntry = { degree: string; field: string; institution: string; year: string };
type ProjEntry = { name: string; description: string; technologies: string };

const INPUT = "w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white dark:bg-white/5 dark:text-gray-200 transition";
const LABEL = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

type Tab = "personal" | "professional" | "applications";

function ProfileContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const { items: applications } = useAppSelector((s) => s.applications);

  // Personal info form
  const [personal, setPersonal] = useState({
    name: "", email: "", phone: "", date_of_birth: "",
    gender: "", nationality: "", residence: "",
    father_name: "", mother_name: "", national_id: "",
  });
  const [personalSaving, setPersonalSaving] = useState(false);

  // Professional profile
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [experience, setExperience] = useState<ExpEntry[]>([{ title: "", company: "", duration: "", description: "" }]);
  const [education, setEducation] = useState<EduEntry[]>([{ degree: "", field: "", institution: "", year: "" }]);
  const [projects, setProjects] = useState<ProjEntry[]>([{ name: "", description: "", technologies: "" }]);

  const [tab, setTab] = useState<Tab>("personal");

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    setPersonal({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      nationality: user.nationality || "",
      residence: user.residence || "",
      father_name: user.father_name || "",
      mother_name: user.mother_name || "",
      national_id: user.national_id || "",
    });
    if (user.role === "applicant") {
      dispatch(loadMyApplications());
      setProfileLoading(true);
      fetchMyProfile().then((profile) => {
        if (profile) {
          setSkills(profile.skills?.join(", ") || "");
          setCertifications(profile.certifications?.join(", ") || "");
          setExperience(profile.experience?.length
            ? profile.experience.map((e) => ({ title: e.title, company: e.company, duration: e.duration, description: e.description || "" }))
            : [{ title: "", company: "", duration: "", description: "" }]);
          setEducation(profile.education?.length
            ? profile.education.map((e) => ({ degree: e.degree, field: e.field, institution: e.institution, year: e.year?.toString() || "" }))
            : [{ degree: "", field: "", institution: "", year: "" }]);
          setProjects(profile.projects?.length
            ? profile.projects.map((p) => ({ name: p.name, description: p.description, technologies: p.technologies?.join(", ") || "" }))
            : [{ name: "", description: "", technologies: "" }]);
          if (profile.cv_filename) setCvFilename(profile.cv_filename);
        }
      }).catch(() => {}).finally(() => setProfileLoading(false));
    }
  }, [user, dispatch, router]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalSaving(true);
    try {
      await dispatch(updateProfile(personal as Partial<User>)).unwrap();
      toast.success("Personal info saved!");
    } catch { toast.error("Update failed"); }
    finally { setPersonalSaving(false); }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploading(true);
    try {
      const res = await uploadMyCV(file);
      setCvFilename(res.cv_filename);
      toast.success("CV uploaded!");
    } catch { toast.error("CV upload failed"); }
    finally { setCvUploading(false); e.target.value = ""; }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateMyProfile({
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        certifications: certifications.split(",").map((s) => s.trim()).filter(Boolean),
        experience: experience.filter((e) => e.title || e.company).map((e) => ({ ...e })),
        education: education.filter((e) => e.degree || e.institution).map((e) => ({ ...e })),
        projects: projects.filter((p) => p.name).map((p) => ({ ...p, technologies: p.technologies.split(",").map((t) => t.trim()).filter(Boolean) })),
      });
      toast.success("Professional profile saved!");
    } catch { toast.error("Failed to save profile"); }
    finally { setProfileSaving(false); }
  };

  if (!user) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = user.role === "applicant"
    ? [
        { key: "personal", label: "Personal Info", icon: <UserIcon size={15} /> },
        { key: "professional", label: "Professional", icon: <Briefcase size={15} /> },
        { key: "applications", label: "Applications", icon: <FolderGit2 size={15} /> },
      ]
    : [{ key: "personal", label: "Personal Info", icon: <UserIcon size={15} /> }];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button when coming from apply page */}
      {returnTo && (
        <button
          onClick={() => router.push(returnTo)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:opacity-80 transition"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft size={14} /> Back to Application
        </button>
      )}
      {/* Header card */}
      <div className="btn-glow rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-white/70 text-sm">{user.email}</p>
            {user.phone && <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5"><Phone size={12} />{user.phone}</p>}
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block font-medium">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            style={tab === key ? { color: "var(--accent)" } : {}}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {tab === "personal" && (
        <form onSubmit={handleSavePersonal} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-gray-900">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Full Name</label>
              <input required value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} className={INPUT} placeholder="John Doe" />
            </div>
            <div>
              <label className={LABEL}>Email Address</label>
              <input type="email" required value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} className={INPUT} placeholder="john@example.com" />
            </div>
            <div>
              <label className={LABEL}>Phone Number</label>
              <input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} className={INPUT} placeholder="+250 7XX XXX XXX" />
            </div>
            <div>
              <label className={LABEL}>Date of Birth</label>
              <input type="date" value={personal.date_of_birth} onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Gender</label>
              <select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })} className={INPUT}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Nationality</label>
              <input value={personal.nationality} onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })} className={INPUT} placeholder="Rwandan" />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Place of Residence</label>
              <input value={personal.residence} onChange={(e) => setPersonal({ ...personal, residence: e.target.value })} className={INPUT} placeholder="Kigali, Rwanda" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Family Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Father's Name</label>
                <input value={personal.father_name} onChange={(e) => setPersonal({ ...personal, father_name: e.target.value })} className={INPUT} placeholder="Father's full name" />
              </div>
              <div>
                <label className={LABEL}>Mother's Name</label>
                <input value={personal.mother_name} onChange={(e) => setPersonal({ ...personal, mother_name: e.target.value })} className={INPUT} placeholder="Mother's full name" />
              </div>
              <div>
                <label className={LABEL}>National ID Number</label>
                <input value={personal.national_id} onChange={(e) => setPersonal({ ...personal, national_id: e.target.value })} className={INPUT} placeholder="1 XXXX X XXXXXXX X XX" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={personalSaving} className="w-full flex items-center justify-center gap-2 btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
            <Save size={15} /> {personalSaving ? "Saving..." : "Save Personal Info"}
          </button>
        </form>
      )}

      {/* Professional Tab (applicants only) */}
      {tab === "professional" && user.role === "applicant" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Professional Profile</h2>
              <p className="text-xs text-gray-400 mt-0.5">Auto-used in all your job applications</p>
            </div>
            <button onClick={handleSaveProfile} disabled={profileSaving} className="flex items-center gap-2 btn-glow text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              <Save size={15} /> {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          {profileLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
            <>
              {/* CV Upload */}
              <div className="accent-bg-light border rounded-2xl p-4" style={{ borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">CV / Resume <span className="text-gray-400 font-normal text-xs">(PDF)</span></label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 cursor-pointer bg-white dark:bg-white/10 border rounded-xl px-4 py-2 text-sm font-medium transition ${cvUploading ? "opacity-50 pointer-events-none" : "hover:opacity-80"}`}
                    style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)", color: "var(--accent)" }}>
                    <Upload size={14} />{cvUploading ? "Uploading..." : "Upload CV"}
                    <input type="file" accept=".pdf" className="hidden" onChange={handleCVUpload} />
                  </label>
                  {cvFilename && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-white/10 border dark:border-white/10 rounded-xl px-3 py-2">
                      <Paperclip size={13} style={{ color: "var(--accent)" }} />{cvFilename}
                    </span>
                  )}
                </div>
              </div>

              {/* Skills & Certs */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={LABEL}>Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input value={skills} onChange={(e) => setSkills(e.target.value)} className={INPUT} placeholder="React, Node.js, TypeScript" />
                </div>
                <div>
                  <label className={LABEL}>Certifications <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input value={certifications} onChange={(e) => setCertifications(e.target.value)} className={INPUT} placeholder="AWS Certified, PMP" />
                </div>
              </div>

              {/* Experience */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5"><Briefcase size={14} style={{ color: "var(--accent)" }} />Work Experience</h3>
                  <button type="button" onClick={() => setExperience([...experience, { title: "", company: "", duration: "", description: "" }])} className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><Plus size={13} /> Add</button>
                </div>
                {experience.map((exp, i) => (
                  <div key={i} className="border rounded-xl p-4 mb-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Job Title" value={exp.title} onChange={(e) => { const n = [...experience]; n[i].title = e.target.value; setExperience(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                      <input placeholder="Company" value={exp.company} onChange={(e) => { const n = [...experience]; n[i].company = e.target.value; setExperience(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <input placeholder="Duration (e.g. 2021–2023)" value={exp.duration} onChange={(e) => { const n = [...experience]; n[i].duration = e.target.value; setExperience(n); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
                    <textarea placeholder="Description" value={exp.description} onChange={(e) => { const n = [...experience]; n[i].description = e.target.value; setExperience(n); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" rows={2} />
                    {experience.length > 1 && <button type="button" onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1"><Minus size={12} /> Remove</button>}
                  </div>
                ))}
              </div>

              {/* Education */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5"><GraduationCap size={14} style={{ color: "var(--accent)" }} />Education</h3>
                  <button type="button" onClick={() => setEducation([...education, { degree: "", field: "", institution: "", year: "" }])} className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><Plus size={13} /> Add</button>
                </div>
                {education.map((edu, i) => (
                  <div key={i} className="border rounded-xl p-4 mb-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Degree (e.g. BSc)" value={edu.degree} onChange={(e) => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                      <input placeholder="Field of Study" value={edu.field} onChange={(e) => { const n = [...education]; n[i].field = e.target.value; setEducation(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Institution" value={edu.institution} onChange={(e) => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                      <input placeholder="Year (e.g. 2020–2023)" value={edu.year} onChange={(e) => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} className="border rounded-lg px-3 py-2 text-sm bg-white" />
                    </div>
                    {education.length > 1 && <button type="button" onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1"><Minus size={12} /> Remove</button>}
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5"><FolderGit2 size={14} style={{ color: "var(--accent)" }} />Projects</h3>
                  <button type="button" onClick={() => setProjects([...projects, { name: "", description: "", technologies: "" }])} className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><Plus size={13} /> Add</button>
                </div>
                {projects.map((proj, i) => (
                  <div key={i} className="border rounded-xl p-4 mb-3 space-y-2 bg-gray-50">
                    <input placeholder="Project Name" value={proj.name} onChange={(e) => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
                    <textarea placeholder="Description" value={proj.description} onChange={(e) => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" rows={2} />
                    <input placeholder="Technologies (comma-separated)" value={proj.technologies} onChange={(e) => { const n = [...projects]; n[i].technologies = e.target.value; setProjects(n); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
                    {projects.length > 1 && <button type="button" onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1"><Minus size={12} /> Remove</button>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {tab === "applications" && user.role === "applicant" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Application History</h2>
            <Link href="/my-applications" className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-gray-400 text-sm">No applications yet. <Link href="/board" className="hover:underline" style={{ color: "var(--accent)" }}>Browse jobs →</Link></p>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 8).map((app) => {
                const job = app.job_id as Job;
                const sc: Record<string, string> = { pending: "bg-amber-100 text-amber-700", reviewed: "bg-blue-100 text-blue-700", shortlisted: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-600" };
                return (
                  <div key={app._id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{typeof job === "object" ? job.title : "Job"}</p>
                      <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${sc[app.status]}`}>{app.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recruiter quick links */}
      {user.role === "recruiter" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/jobs/new", label: "✏️ Create New Job" },
              { href: "/jobs", label: "📋 Manage Jobs" },
              { href: "/candidates", label: "👥 Candidate Pool" },
              { href: "/", label: "📊 Dashboard" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="glass-card px-4 py-3 text-sm font-medium text-center hover:opacity-80 transition dark:text-gray-300">{label}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}