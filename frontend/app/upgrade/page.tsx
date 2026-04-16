"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "../../store/hooks";
import { Check, CreditCard, Lock, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { upgradePlan, fetchPublicPlanConfigs, fetchPublicApplicantPlanConfigs } from "../../lib/api";
import { useAppDispatch } from "../../store/hooks";
import { loadMe } from "../../store/slices/authSlice";
import Cookies from "js-cookie";

interface RecruiterConfig { plan: string; maxJobs: number; maxScreeningsPerMonth: number; csvUpload: boolean; resumeUpload: boolean; monthlyPrice: number; yearlyPrice: number; }
interface ApplicantConfig { plan: string; maxApplications: number; maxCVUploads: number; profileHighlight: boolean; monthlyPrice: number; yearlyPrice: number; }

function buildFeatures(planKey: string, config: RecruiterConfig | ApplicantConfig | null): string[] {
  if (!config) return [];
  const features: string[] = [];
  
  if ('maxJobs' in config) {
    // Recruiter plan
    features.push(config.maxJobs === -1 ? "Unlimited job posts" : `${config.maxJobs} active job posts`);
    features.push(config.maxScreeningsPerMonth === -1 ? "Unlimited AI screenings" : `${config.maxScreeningsPerMonth} AI screenings/month`);
    if (config.csvUpload) features.push("CSV & XLSX bulk import");
    if (config.resumeUpload) features.push("PDF resume bulk upload");
    features.push("Priority support");
  } else {
    // Applicant plan
    features.push(config.maxApplications === -1 ? "Unlimited job applications" : `${config.maxApplications} job applications/month`);
    features.push(config.maxCVUploads === -1 ? "Unlimited CV uploads" : `${config.maxCVUploads} CV uploads`);
    if (config.profileHighlight) features.push("Profile highlighted to recruiters");
    features.push("Priority application review");
  }
  
  return features;
}

const PAYMENT_METHODS = [
  { id: "mtn",    label: "MTN Mobile Money",   icon: "📱", placeholder: "07X XXX XXXX" },
  { id: "airtel", label: "Airtel Money",        icon: "📱", placeholder: "07X XXX XXXX" },
  { id: "card",   label: "Credit / Debit Card", icon: "💳", placeholder: "Card number" },
  { id: "bank",   label: "Bank Transfer",       icon: "🏦", placeholder: "Account number" },
];

function UpgradeContent() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") || "recruiter_pro";

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [payMethod, setPayMethod] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planConfig, setPlanConfig] = useState<RecruiterConfig | ApplicantConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (planKey.startsWith("applicant")) {
          const configs = await fetchPublicApplicantPlanConfigs();
          const config = configs.find((c: ApplicantConfig) => c.plan === "pro");
          setPlanConfig(config || null);
        } else {
          const configs = await fetchPublicPlanConfigs();
          const plan = planKey === "recruiter_enterprise" ? "enterprise" : "pro";
          const config = configs.find((c: RecruiterConfig) => c.plan === plan);
          setPlanConfig(config || null);
        }
      } catch (err) {
        toast.error("Failed to load plan details");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [planKey]);

  const planName = planKey === "recruiter_pro" ? "Recruiter Pro" 
    : planKey === "recruiter_enterprise" ? "Recruiter Enterprise" 
    : "Applicant Pro";
  
  const price = planConfig ? (billing === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice) : 0;
  const monthlyPrice = planConfig?.monthlyPrice || 0;
  const yearlyPrice = planConfig?.yearlyPrice || 0;
  const saving = monthlyPrice * 12 - yearlyPrice;
  const features = buildFeatures(planKey, planConfig);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error("Please enter your payment details"); return; }
    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      // Map plan key to DB plan name
      const dbPlan = planKey === "recruiter_enterprise" ? "enterprise" : "pro";

      // Save plan to database
      const res = await upgradePlan(dbPlan, billing);

      // Update token and user in Redux + cookie
      Cookies.set("token", res.token, { expires: 7 });
      await dispatch(loadMe());

      setDone(true);
      toast.success(`🎉 Upgraded to ${planName} successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-100 dark:bg-white/10 rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-96" />
          <div className="glass-card p-6 h-96" />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Payment Initiated!</h2>
        <p className="text-gray-500">You'll receive a confirmation on your phone/email shortly. Your plan will be activated once payment is confirmed.</p>
        <Link href="/profile" className="btn-glow text-white px-8 py-3 rounded-xl font-bold inline-block">
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition" style={{ color: "var(--accent)" }}>
        <ArrowLeft size={14} /> Back to Pricing
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan summary */}
        <div className="glass-card p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Upgrading to</p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{planName}</h1>
          </div>

          {/* Billing toggle */}
          <div className="flex gap-2">
            {(["monthly", "yearly"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition capitalize ${
                  billing === b ? "btn-glow text-white border-transparent" : "border-gray-200 dark:border-white/10 text-gray-500"
                }`}>
                {b}
                {b === "yearly" && (
                  <span className="ml-1.5 text-xs text-green-400">Save RWF {saving.toLocaleString()}</span>
                )}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="rounded-2xl p-5 text-center" style={{ background: "var(--accent-light)" }}>
            <p className="text-4xl font-extrabold" style={{ color: "var(--accent)" }}>
              RWF {price.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">per {billing === "yearly" ? "year" : "month"}</p>
          </div>

          {/* Features */}
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                <Check size={15} className="shrink-0" style={{ color: "var(--accent)" }} /> {f}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t dark:border-white/10">
            <Lock size={12} /> Secure payment · Cancel anytime
          </div>
        </div>

        {/* Payment form */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-white">Payment Method</h2>

          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ id, label, icon }) => (
              <button key={id} type="button" onClick={() => setPayMethod(id)}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={payMethod === id
                  ? { borderColor: "var(--accent)", background: "var(--accent-light)" }
                  : { borderColor: "transparent" }}>
                <span className="text-lg block mb-1">{icon}</span>
                <p className="text-xs font-semibold"
                  style={payMethod === id ? { color: "var(--accent)" } : { color: "#6b7280" }}>
                  {label}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {payMethod === "card" ? "Card Number" : payMethod === "bank" ? "Account Number" : "Phone Number"}
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                placeholder={PAYMENT_METHODS.find((m) => m.id === payMethod)?.placeholder}
                className="w-full border dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
            </div>

            {payMethod === "card" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expiry</label>
                  <input placeholder="MM/YY" className="w-full border dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">CVV</label>
                  <input placeholder="123" className="w-full border dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition" />
                </div>
              </div>
            )}

            <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: "var(--accent-light)" }}>
              <p className="font-semibold" style={{ color: "var(--accent)" }}>Order Summary</p>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>{planName} ({billing})</span>
                <span className="font-bold">RWF {price.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" disabled={processing}
              className="w-full btn-glow text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><CreditCard size={16} /> Pay RWF {price.toLocaleString()}</>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              By proceeding you agree to our terms of service. You can cancel anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-100 dark:bg-white/10 rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-96" />
          <div className="glass-card p-6 h-96" />
        </div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
