"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminGetPlanConfigs, adminUpdatePlanConfig, adminGetApplicantPlanConfigs, adminUpdateApplicantPlanConfig } from "../../../lib/api";
import { Shield, Save, Infinity as InfinityIcon, Briefcase, User } from "lucide-react";

interface PlanConfig {
  plan: string;
  maxJobs: number;
  maxScreeningsPerMonth: number;
  csvUpload: boolean;
  resumeUpload: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface ApplicantConfig {
  plan: string;
  maxApplications: number;
  maxCVUploads: number;
  profileHighlight: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string; price: string }> = {
  free:       { label: "Free",       color: "from-gray-400 to-gray-500",     price: "RWF 0" },
  pro:        { label: "Pro",        color: "from-indigo-500 to-violet-500", price: "RWF 10,000/mo" },
  enterprise: { label: "Enterprise", color: "from-amber-500 to-orange-500",  price: "RWF 30,000/mo" },
};

const INPUT = "w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white dark:bg-white/5 dark:text-gray-200";

export default function AdminPlansPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [configs, setConfigs] = useState<PlanConfig[]>([]);
  const [applicantConfigs, setApplicantConfigs] = useState<ApplicantConfig[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "admin") { router.push("/"); return; }
    Promise.all([adminGetPlanConfigs(), adminGetApplicantPlanConfigs()])
      .then(([r, a]) => { setConfigs(r); setApplicantConfigs(a); })
      .catch(() => toast.error("Failed to load plan configs"))
      .finally(() => setLoading(false));
  }, [user, router]);

  const update = (plan: string, field: keyof PlanConfig, value: any) => {
    setConfigs((prev) => prev.map((c) => c.plan === plan ? { ...c, [field]: value } : c));
  };

  const updateApplicant = (plan: string, field: keyof ApplicantConfig, value: any) => {
    setApplicantConfigs((prev) => prev.map((c) => c.plan === plan ? { ...c, [field]: value } : c));
  };

  const handleSave = async (config: PlanConfig) => {
    setSaving(config.plan);
    try {
      await adminUpdatePlanConfig(config.plan, { 
        maxJobs: config.maxJobs, 
        maxScreeningsPerMonth: config.maxScreeningsPerMonth, 
        csvUpload: config.csvUpload, 
        resumeUpload: config.resumeUpload,
        monthlyPrice: config.monthlyPrice,
        yearlyPrice: config.yearlyPrice
      });
      toast.success(`${config.plan} plan updated!`);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  };

  const handleSaveApplicant = async (config: ApplicantConfig) => {
    setSaving(`applicant-${config.plan}`);
    try {
      await adminUpdateApplicantPlanConfig(config.plan, { 
        maxApplications: config.maxApplications, 
        maxCVUploads: config.maxCVUploads, 
        profileHighlight: config.profileHighlight,
        monthlyPrice: config.monthlyPrice,
        yearlyPrice: config.yearlyPrice
      });
      toast.success(`Applicant ${config.plan} plan updated!`);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(null); }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="btn-glow rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-white/80" />
          <span className="text-white/80 text-sm">Admin Panel</span>
        </div>
        <h1 className="text-2xl font-extrabold">Plan Feature Controls</h1>
        <p className="text-white/70 text-sm mt-1">Set limits for each plan. Use -1 for unlimited.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-6 h-64 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Recruiter Plans */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} style={{ color: "var(--accent)" }} />
              <h2 className="font-bold text-gray-900 dark:text-white">Recruiter Plans</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {configs.map((config) => {
                const meta = PLAN_LABELS[config.plan];
                return (
                  <div key={config.plan} className="glass-card p-6 space-y-4">
                    <div className={`w-full rounded-xl bg-gradient-to-r ${meta.color} p-4 text-white`}>
                      <p className="font-extrabold text-lg">{meta.label}</p>
                      <p className="text-white/80 text-sm">{meta.price}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Monthly Price (RWF)</label>
                        <input type="number" min={0} value={config.monthlyPrice} onChange={(e) => update(config.plan, "monthlyPrice", parseInt(e.target.value) || 0)} className={INPUT} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Yearly Price (RWF)</label>
                        <input type="number" min={0} value={config.yearlyPrice} onChange={(e) => update(config.plan, "yearlyPrice", parseInt(e.target.value) || 0)} className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Max Job Posts <span className="normal-case font-normal">(-1 = unlimited)</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={-1} value={config.maxJobs} onChange={(e) => update(config.plan, "maxJobs", parseInt(e.target.value))} className={INPUT} />
                        {config.maxJobs === -1 && <InfinityIcon size={16} className="text-gray-400 shrink-0" />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">AI Screenings / Month <span className="normal-case font-normal">(-1 = unlimited)</span></label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={-1} value={config.maxScreeningsPerMonth} onChange={(e) => update(config.plan, "maxScreeningsPerMonth", parseInt(e.target.value))} className={INPUT} />
                        {config.maxScreeningsPerMonth === -1 && <InfinityIcon size={16} className="text-gray-400 shrink-0" />}
                      </div>
                    </div>
                    <div className="space-y-3 pt-1">
                      {([{ field: "csvUpload" as const, label: "CSV / XLSX Bulk Upload" }, { field: "resumeUpload" as const, label: "PDF Resume Bulk Upload" }]).map(({ field, label }) => (
                        <div key={field} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                          <button onClick={() => update(config.plan, field, !config[field])} className={`relative w-11 h-6 rounded-full transition-colors ${config[field] ? "btn-glow" : "bg-gray-300 dark:bg-gray-600"}`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config[field] ? "translate-x-5" : ""}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleSave(config)} disabled={saving === config.plan} className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <Save size={14} /> {saving === config.plan ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Applicant Plans */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} style={{ color: "var(--accent)" }} />
              <h2 className="font-bold text-gray-900 dark:text-white">Applicant Plans</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
              {applicantConfigs.map((config) => (
                <div key={config.plan} className="glass-card p-6 space-y-4">
                  <div className={`w-full rounded-xl p-4 text-white bg-gradient-to-r ${config.plan === "free" ? "from-gray-400 to-gray-500" : "from-indigo-500 to-violet-500"}`}>
                    <p className="font-extrabold text-lg capitalize">{config.plan}</p>
                    <p className="text-white/80 text-sm">{config.plan === "free" ? "RWF 0" : "RWF 5,000/mo"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Monthly Price (RWF)</label>
                      <input type="number" min={0} value={config.monthlyPrice} onChange={(e) => updateApplicant(config.plan, "monthlyPrice", parseInt(e.target.value) || 0)} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Yearly Price (RWF)</label>
                      <input type="number" min={0} value={config.yearlyPrice} onChange={(e) => updateApplicant(config.plan, "yearlyPrice", parseInt(e.target.value) || 0)} className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Max Applications <span className="normal-case font-normal">(-1 = unlimited)</span></label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={-1} value={config.maxApplications} onChange={(e) => updateApplicant(config.plan, "maxApplications", parseInt(e.target.value))} className={INPUT} />
                      {config.maxApplications === -1 && <InfinityIcon size={16} className="text-gray-400 shrink-0" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Max CV Uploads <span className="normal-case font-normal">(-1 = unlimited)</span></label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={-1} value={config.maxCVUploads} onChange={(e) => updateApplicant(config.plan, "maxCVUploads", parseInt(e.target.value))} className={INPUT} />
                      {config.maxCVUploads === -1 && <InfinityIcon size={16} className="text-gray-400 shrink-0" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Profile Highlighted to Recruiters</span>
                    <button onClick={() => updateApplicant(config.plan, "profileHighlight", !config.profileHighlight)} className={`relative w-11 h-6 rounded-full transition-colors ${config.profileHighlight ? "btn-glow" : "bg-gray-300 dark:bg-gray-600"}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.profileHighlight ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <button onClick={() => handleSaveApplicant(config)} disabled={saving === `applicant-${config.plan}`} className="w-full btn-glow text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={14} /> {saving === `applicant-${config.plan}` ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Info box */}
      <div className="glass-card p-5 text-sm text-gray-500 dark:text-gray-400 space-y-1">
        <p className="font-semibold text-gray-700 dark:text-gray-300">How it works</p>
        <p>• Changes take effect immediately for all users on that plan</p>
        <p>• Set <strong>-1</strong> on any numeric field to make it unlimited</p>
        <p>• Free plan users who already exceeded a limit won't lose existing data — they just can't add more</p>
      </div>
    </div>
  );
}
