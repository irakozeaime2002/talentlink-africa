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
import { Plus, Minus, Save, Paperclip, Upload, User as UserIcon, Briefcase, GraduationCap, FolderGit2, Phone, ArrowLeft, Crown, Globe, Link2, Lock, Eye, EyeOff } from "lucide-react";

type SkillEntry = { name: string; level: string; yearsOfExperience: string };
type LangEntry = { name: string; proficiency: string };
type ExpEntry = { company: string; role: string; startDate: string; endDate: string; description: string; technologies: string; isCurrent: boolean };
type EduEntry = { institution: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string };
type CertEntry = { name: string; issuer: string; issueDate: string };
type ProjEntry = { name: string; description: string; technologies: string; role: string; link: string; startDate: string; endDate: string };

const INPUT = "w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white dark:bg-gray-800 dark:text-gray-200 transition";
const SELECT = "w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white dark:bg-gray-800 dark:text-gray-200 transition [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:dark:text-gray-200";
const LABEL = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

type Tab = "personal" | "professional" | "applications";

function ProfileContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, loading: authLoading } = useAppSelector((s) => s.auth);
  const { items: applications } = useAppSelector((s) => s.applications);

  const [personal, setPersonal] = useState({
    name: "", email: "", phone: "", date_of_birth: "",
    gender: "", nationality: "", residence: "",
    father_name: "", mother_name: "", national_id: "",
  });
  const [personalSaving, setPersonalSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<SkillEntry[]>([{ name: "", level: "", yearsOfExperience: "" }]);
  const [languages, setLanguages] = useState<LangEntry[]>([{ name: "", proficiency: "" }]);
  const [certifications, setCertifications] = useState<CertEntry[]>([{ name: "", issuer: "", issueDate: "" }]);
  const [experience, setExperience] = useState<ExpEntry[]>([{ company: "", role: "", startDate: "", endDate: "", description: "", technologies: "", isCurrent: false }]);
  const [education, setEducation] = useState<EduEntry[]>([{ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }]);
  const [projects, setProjects] = useState<ProjEntry[]>([{ name: "", description: "", technologies: "", role: "", link: "", startDate: "", endDate: "" }]);
  const [availability, setAvailability] = useState({ status: "", type: "", startDate: "" });
  const [socialLinks, setSocialLinks] = useState<{ name: string; url: string }[]>([{ name: "", url: "" }]);
  const [tab, setTab] = useState<Tab>("personal");

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    setPersonal({
      name: user.name || "", email: user.email || "", phone: user.phone || "",
      date_of_birth: user.date_of_birth || "", gender: user.gender || "",
      nationality: user.nationality || "", residence: user.residence || "",
      father_name: user.father_name || "", mother_name: user.mother_name || "",
      national_id: user.national_id || "",
    });
    if (user.role === "applicant") {
      dispatch(loadMyApplications());
      setProfileLoading(true);
      fetchMyProfile().then((profile) => {
        if (profile) {
          setHeadline(profile.headline || "");
          setBio(profile.bio || "");
          setLocation(profile.location || "");
          setSkills(profile.skills?.length
            ? profile.skills.map((s) => ({ name: s.name, level: s.level || "", yearsOfExperience: s.yearsOfExperience?.toString() || "" }))
            : [{ name: "", level: "", yearsOfExperience: "" }]);
          setLanguages((profile as any).languages?.length
            ? (profile as any).languages.map((l: any) => ({ name: l.name, proficiency: l.proficiency || "" }))
            : [{ name: "", proficiency: "" }]);
          setCertifications(profile.certifications?.length
            ? profile.certifications.map((c) => ({ name: c.name, issuer: c.issuer || "", issueDate: c.issueDate || "" }))
            : [{ name: "", issuer: "", issueDate: "" }]);
          setExperience(profile.experience?.length
            ? profile.experience.map((e) => ({ company: e.company, role: e.role, startDate: e.startDate || "", endDate: e.endDate || "", description: e.description || "", technologies: e.technologies?.join(", ") || "", isCurrent: e.isCurrent || false }))
            : [{ company: "", role: "", startDate: "", endDate: "", description: "", technologies: "", isCurrent: false }]);
          setEducation(profile.education?.length
            ? profile.education.map((e) => ({ institution: e.institution, degree: e.degree, fieldOfStudy: e.fieldOfStudy || "", startYear: e.startYear?.toString() || "", endYear: e.endYear?.toString() || "" }))
            : [{ institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }]);
          setProjects(profile.projects?.length
            ? profile.projects.map((p) => ({ name: p.name, description: p.description, technologies: p.technologies?.join(", ") || "", role: p.role || "", link: p.link || "", startDate: p.startDate || "", endDate: p.endDate || "" }))
            : [{ name: "", description: "", technologies: "", role: "", link: "", startDate: "", endDate: "" }]);
          if ((profile as any).availability) setAvailability({ status: (profile as any).availability.status || "", type: (profile as any).availability.type || "", startDate: (profile as any).availability.startDate || "" });
          setSocialLinks((profile as any).socialLinks
            ? Object.entries((profile as any).socialLinks instanceof Map ? Object.fromEntries((profile as any).socialLinks) : (profile as any).socialLinks).map(([name, url]) => ({ name, url: url as string }))
            : [{ name: "", url: "" }]);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const { changePassword } = await import("../../lib/api");
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
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
        headline, bio, location,
        skills: skills.filter((s) => s.name).map((s) => ({ name: s.name, level: s.level as any || undefined, yearsOfExperience: s.yearsOfExperience ? Number(s.yearsOfExperience) : undefined })),
        languages: languages.filter((l) => l.name).map((l) => ({ name: l.name, proficiency: l.proficiency as any || undefined })),
        certifications: certifications.filter((c) => c.name).map((c) => ({ name: c.name, issuer: c.issuer || undefined, issueDate: c.issueDate || undefined })),
        experience: experience.filter((e) => e.role || e.company).map((e) => ({ company: e.company, role: e.role, startDate: e.startDate || undefined, endDate: e.isCurrent ? "Present" : (e.endDate || undefined), description: e.description || undefined, technologies: e.technologies ? e.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [], isCurrent: e.isCurrent })),
        education: education.filter((e) => e.degree || e.institution).map((e) => ({ institution: e.institution, degree: e.degree, fieldOfStudy: e.fieldOfStudy || undefined, startYear: e.startYear ? Number(e.startYear) : undefined, endYear: e.endYear ? Number(e.endYear) : undefined })),
        projects: projects.filter((p) => p.name).map((p) => ({ name: p.name, description: p.description, technologies: p.technologies ? p.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [], role: p.role || undefined, link: p.link || undefined, startDate: p.startDate || undefined, endDate: p.endDate || undefined })),
        availability: availability.status ? { status: availability.status as any, type: availability.type as any || undefined, startDate: availability.startDate || undefined } : undefined,
        socialLinks: socialLinks.filter((l) => l.name && l.url).reduce((acc, l) => ({ ...acc, [l.name]: l.url }), {}),
      } as any);
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
      {returnTo && (
        <button onClick={() => router.push(returnTo)}
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition"
          style={{ color: "var(--accent)" }}>
          <ArrowLeft size={14} /> Back to Application
        </button>
      )}

      {/* Header */}
      <div className="btn-glow rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-white/70 text-sm">{user.email}</p>
            {user.phone && <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5"><Phone size={12} />{user.phone}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full capitalize font-medium">{user.role}</span>
              {(user as any).plan && (user as any).plan !== "free" && (
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full capitalize font-medium flex items-center gap-1">
                  <Crown size={10} /> {(user as any).plan}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
        {tabs.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-white dark:bg-white/10 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            style={tab === key ? { color: "var(--accent)" } : {}}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {tab === "personal" && (
        <form onSubmit={handleSavePersonal} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Personal Information</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your basic personal details and contact information</p>
          </div>
          
          <div className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <UserIcon size={14} style={{ color: "var(--accent)" }} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
                <input required value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} className={INPUT} placeholder="John Doe" />
              </div>
              <div>
                <label className={LABEL}>Email Address <span className="text-red-500">*</span></label>
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
                <select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })} className={SELECT}>
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
          </div>

          <div className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Family Information</h3>
            <p className="text-xs text-gray-400 mb-4">Optional family details for official records</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Father's Name</label>
                <input value={personal.father_name} onChange={(e) => setPersonal({ ...personal, father_name: e.target.value })} className={INPUT} placeholder="Father's full name" />
              </div>
              <div>
                <label className={LABEL}>Mother's Name</label>
                <input value={personal.mother_name} onChange={(e) => setPersonal({ ...personal, mother_name: e.target.value })} className={INPUT} placeholder="Mother's full name" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>National ID Number</label>
                <input value={personal.national_id} onChange={(e) => setPersonal({ ...personal, national_id: e.target.value })} className={INPUT} placeholder="1 XXXX X XXXXXXX X XX" />
              </div>
            </div>
          </div>

          <div className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Lock size={14} style={{ color: "var(--accent)" }} />
              Change Password
            </h3>
            <p className="text-xs text-gray-400 mb-4">Update your account password for security</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={LABEL}>Current Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className={INPUT}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={INPUT}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Confirm New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={INPUT}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 dark:bg-white/10 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 transition"
              >
                <Save size={15} /> {passwordSaving ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          <button type="submit" disabled={personalSaving} className="w-full flex items-center justify-center gap-2 btn-glow text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
            <Save size={15} /> {personalSaving ? "Saving..." : "Save Personal Info"}
          </button>
        </form>
      )}

      {/* Professional Tab */}
      {tab === "professional" && user.role === "applicant" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Professional Profile</h2>
              <p className="text-xs text-gray-400 mt-0.5">Auto-used in all your job applications</p>
            </div>
            <button onClick={handleSaveProfile} disabled={profileSaving} className="flex items-center gap-2 btn-glow text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              <Save size={15} /> {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
          {profileLoading ? <p className="text-gray-400 text-sm">Loading...</p> : (
            <>
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
              <div className="grid gap-4">
                <div>
                  <label className={LABEL}>Professional Headline <span className="text-red-500">*</span></label>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={INPUT} placeholder="e.g., Backend Engineer – Node.js & AI Systems" />
                  <p className="text-xs text-gray-400 mt-1">A short summary of your professional identity</p>
                </div>
                <div>
                  <label className={LABEL}>Professional Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={INPUT} placeholder="Tell us about your professional background, expertise, and career goals..." rows={3} />
                  <p className="text-xs text-gray-400 mt-1">Detailed professional biography (optional but recommended)</p>
                </div>
                <div>
                  <label className={LABEL}>Current Location <span className="text-red-500">*</span></label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={INPUT} placeholder="e.g., Kigali, Rwanda" />
                  <p className="text-xs text-gray-400 mt-1">City and country where you currently reside</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">Skills <span className="text-red-500">*</span></h3>
                    <p className="text-xs text-gray-400 mt-0.5">List your technical and professional skills with proficiency levels</p>
                  </div>
                  <button type="button" onClick={() => setSkills([...skills, { name: "", level: "", yearsOfExperience: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Skill</button>
                </div>
                {skills.map((s, i) => (
                  <div key={i} className="border-2 rounded-2xl p-4 mb-3 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Skill Name</label>
                        <input placeholder="e.g., Node.js, Python, React" value={s.name} onChange={(e) => { const n = [...skills]; n[i].name = e.target.value; setSkills(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Proficiency Level</label>
                        <select value={s.level} onChange={(e) => { const n = [...skills]; n[i].level = e.target.value; setSkills(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:dark:text-gray-200">
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Years of Experience</label>
                        <input type="number" placeholder="e.g., 3" min="0" max="50" value={s.yearsOfExperience} onChange={(e) => { const n = [...skills]; n[i].yearsOfExperience = e.target.value; setSkills(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    {skills.length > 1 && (
                      <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-3 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Skill
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5"><Globe size={14} style={{ color: "var(--accent)" }} />Languages</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Spoken languages and proficiency levels</p>
                  </div>
                  <button type="button" onClick={() => setLanguages([...languages, { name: "", proficiency: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Language</button>
                </div>
                {languages.map((l, i) => (
                  <div key={i} className="border-2 rounded-2xl p-4 mb-3 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Language</label>
                        <input placeholder="e.g., English, French, Kinyarwanda" value={l.name} onChange={(e) => { const n = [...languages]; n[i].name = e.target.value; setLanguages(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Proficiency Level</label>
                        <select value={l.proficiency} onChange={(e) => { const n = [...languages]; n[i].proficiency = e.target.value; setLanguages(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:dark:text-gray-200">
                          <option value="">Select Level</option>
                          <option value="Basic">Basic</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Native">Native</option>
                        </select>
                      </div>
                    </div>
                    {languages.length > 1 && (
                      <button type="button" onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-3 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Language
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5"><Briefcase size={14} style={{ color: "var(--accent)" }} />Work Experience <span className="text-red-500">*</span></h3>
                    <p className="text-xs text-gray-400 mt-0.5">Your professional work history and achievements</p>
                  </div>
                  <button type="button" onClick={() => setExperience([...experience, { company: "", role: "", startDate: "", endDate: "", description: "", technologies: "", isCurrent: false }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Experience</button>
                </div>
                {experience.map((exp, i) => (
                  <div key={i} className="border-2 rounded-2xl p-5 mb-4 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Job Title / Role</label>
                        <input placeholder="e.g., Backend Engineer" value={exp.role} onChange={(e) => { const n = [...experience]; n[i].role = e.target.value; setExperience(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Company Name</label>
                        <input placeholder="e.g., Tech Solutions Ltd" value={exp.company} onChange={(e) => { const n = [...experience]; n[i].company = e.target.value; setExperience(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Start Date (Month & Year)</label>
                        <input type="month" value={exp.startDate} onChange={(e) => { const n = [...experience]; n[i].startDate = e.target.value; setExperience(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">End Date (Month & Year)</label>
                        <input type="month" value={exp.endDate} onChange={(e) => { const n = [...experience]; n[i].endDate = e.target.value; setExperience(n); }} disabled={exp.isCurrent} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-3 cursor-pointer">
                      <input type="checkbox" checked={exp.isCurrent} onChange={(e) => { const n = [...experience]; n[i].isCurrent = e.target.checked; if (e.target.checked) n[i].endDate = ""; setExperience(n); }} className="w-4 h-4 rounded accent-[var(--accent)]" />
                      <span className="font-medium">I currently work here</span>
                    </label>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Key Responsibilities & Achievements</label>
                      <textarea placeholder="Describe your main responsibilities, achievements, and impact..." value={exp.description} onChange={(e) => { const n = [...experience]; n[i].description = e.target.value; setExperience(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" rows={3} />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Technologies Used</label>
                      <input placeholder="e.g., Node.js, PostgreSQL, Docker, AWS" value={exp.technologies} onChange={(e) => { const n = [...experience]; n[i].technologies = e.target.value; setExperience(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                    </div>
                    {experience.length > 1 && (
                      <button type="button" onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-4 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Experience
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5"><GraduationCap size={14} style={{ color: "var(--accent)" }} />Education <span className="text-red-500">*</span></h3>
                    <p className="text-xs text-gray-400 mt-0.5">Your academic background and qualifications</p>
                  </div>
                  <button type="button" onClick={() => setEducation([...education, { institution: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Education</button>
                </div>
                {education.map((edu, i) => (
                  <div key={i} className="border-2 rounded-2xl p-5 mb-4 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Degree</label>
                        <input placeholder="e.g., Bachelor's, Master's, PhD" value={edu.degree} onChange={(e) => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Field of Study</label>
                        <input placeholder="e.g., Computer Science, Engineering" value={edu.fieldOfStudy} onChange={(e) => { const n = [...education]; n[i].fieldOfStudy = e.target.value; setEducation(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Institution / University</label>
                      <input placeholder="e.g., University of Rwanda" value={edu.institution} onChange={(e) => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Start Year</label>
                        <input type="number" placeholder="e.g., 2020" min="1950" max="2030" value={edu.startYear} onChange={(e) => { const n = [...education]; n[i].startYear = e.target.value; setEducation(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">End Year (or Expected)</label>
                        <input type="number" placeholder="e.g., 2024" min="1950" max="2030" value={edu.endYear} onChange={(e) => { const n = [...education]; n[i].endYear = e.target.value; setEducation(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    {education.length > 1 && (
                      <button type="button" onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-4 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Education
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">Professional Certifications</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Industry certifications and credentials (optional but recommended)</p>
                  </div>
                  <button type="button" onClick={() => setCertifications([...certifications, { name: "", issuer: "", issueDate: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Certification</button>
                </div>
                {certifications.map((c, i) => (
                  <div key={i} className="border-2 rounded-2xl p-4 mb-3 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Certification Name</label>
                        <input placeholder="e.g., AWS Certified Developer" value={c.name} onChange={(e) => { const n = [...certifications]; n[i].name = e.target.value; setCertifications(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Issuing Organization</label>
                        <input placeholder="e.g., Amazon, Microsoft" value={c.issuer} onChange={(e) => { const n = [...certifications]; n[i].issuer = e.target.value; setCertifications(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Issue Date (Month & Year)</label>
                        <input type="month" value={c.issueDate} onChange={(e) => { const n = [...certifications]; n[i].issueDate = e.target.value; setCertifications(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    {certifications.length > 1 && (
                      <button type="button" onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-3 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Certification
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5"><FolderGit2 size={14} style={{ color: "var(--accent)" }} />Portfolio Projects <span className="text-red-500">*</span></h3>
                    <p className="text-xs text-gray-400 mt-0.5">Showcase your work and practical experience</p>
                  </div>
                  <button type="button" onClick={() => setProjects([...projects, { name: "", description: "", technologies: "", role: "", link: "", startDate: "", endDate: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Project</button>
                </div>
                {projects.map((proj, i) => (
                  <div key={i} className="border-2 rounded-2xl p-5 mb-4 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Project Name</label>
                      <input placeholder="e.g., AI Recruitment System" value={proj.name} onChange={(e) => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Project Description</label>
                      <textarea placeholder="Describe the project, your contributions, and key achievements..." value={proj.description} onChange={(e) => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" rows={3} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Your Role</label>
                        <input placeholder="e.g., Backend Engineer, Team Lead" value={proj.role} onChange={(e) => { const n = [...projects]; n[i].role = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Project Link</label>
                        <input placeholder="GitHub, Live Demo, or Portfolio URL" value={proj.link} onChange={(e) => { const n = [...projects]; n[i].link = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Technologies Used</label>
                      <input placeholder="e.g., Next.js, Node.js, Gemini API, PostgreSQL" value={proj.technologies} onChange={(e) => { const n = [...projects]; n[i].technologies = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Start Date (Month & Year)</label>
                        <input type="month" value={proj.startDate} onChange={(e) => { const n = [...projects]; n[i].startDate = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">End Date (Leave empty if ongoing)</label>
                        <input type="month" value={proj.endDate} onChange={(e) => { const n = [...projects]; n[i].endDate = e.target.value; setProjects(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    {projects.length > 1 && (
                      <button type="button" onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-4 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Project
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-2">
                  <h3 className="font-semibold text-sm">Availability <span className="text-red-500">*</span></h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your current job search status and preferences</p>
                </div>
                <div className="border-2 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Current Status</label>
                      <select value={availability.status} onChange={(e) => setAvailability({ ...availability, status: e.target.value })} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:dark:text-gray-200">
                        <option value="">Select Status</option>
                        <option value="Available">Available Immediately</option>
                        <option value="Open to Opportunities">Open to Opportunities</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Employment Type</label>
                      <select value={availability.type} onChange={(e) => setAvailability({ ...availability, type: e.target.value })} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:dark:text-gray-200">
                        <option value="">Select Type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Available From (Optional)</label>
                      <input type="date" value={availability.startDate} onChange={(e) => setAvailability({ ...availability, startDate: e.target.value })} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5"><Link2 size={14} style={{ color: "var(--accent)" }} />Social & Professional Links</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Add your professional profiles and portfolio links</p>
                  </div>
                  <button type="button" onClick={() => setSocialLinks([...socialLinks, { name: "", url: "" }])} className="text-xs flex items-center gap-1 hover:underline font-semibold" style={{ color: "var(--accent)" }}><Plus size={13} /> Add Link</button>
                </div>
                {socialLinks.map((link, i) => (
                  <div key={i} className="border-2 rounded-2xl p-4 mb-3 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-white/10 shadow-sm hover:shadow-md transition" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Platform Name</label>
                        <input placeholder="e.g., LinkedIn, GitHub, Portfolio" value={link.name} onChange={(e) => { const n = [...socialLinks]; n[i].name = e.target.value; setSocialLinks(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Profile URL</label>
                        <input placeholder="https://..." value={link.url} onChange={(e) => { const n = [...socialLinks]; n[i].url = e.target.value; setSocialLinks(n); }} className="w-full border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/10 focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition" />
                      </div>
                    </div>
                    {socialLinks.length > 1 && (
                      <button type="button" onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} className="text-red-500 text-xs flex items-center gap-1 mt-3 hover:text-red-600 font-medium">
                        <Minus size={12} /> Remove Link
                      </button>
                    )}
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
            <h2 className="font-bold text-gray-900 dark:text-white">Application History</h2>
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
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{typeof job === "object" ? job.title : "Job"}</p>
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

      {/* Plan section — links to pricing */}
      {(user.role === "applicant" || user.role === "recruiter") && 
       !((user.role === "applicant" && (user as any).plan === "pro") || (user.role === "recruiter" && (user as any).plan === "enterprise")) && (
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl accent-icon-bg flex items-center justify-center">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Current Plan: <span className="capitalize" style={{ color: "var(--accent)" }}>{(user as any).plan || "Free"}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.role === "recruiter" && (user as any).plan === "pro" 
                  ? "Enjoying Pro? Explore Enterprise for unlimited access" 
                  : "Upgrade to unlock more features"}
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-glow text-white px-4 py-2 rounded-xl text-sm font-semibold">
            {user.role === "recruiter" && (user as any).plan === "pro" ? "View Enterprise" : "Upgrade Plan"}
          </Link>
        </div>
      )}

      {/* Recruiter quick links */}
      {user.role === "recruiter" && (
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
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
