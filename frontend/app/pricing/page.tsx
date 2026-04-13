"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Check, X, Building, User, Zap, Rocket, Star } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { useRouter } from "next/navigation";
import { fetchPublicPlanConfigs, fetchPublicApplicantPlanConfigs, upgradePlan } from "../../lib/api";
import { upgradePlan as upgradePlanAction } from "../../store/slices/authSlice";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

interface RecruiterConfig { plan: string; maxJobs: number; maxScreeningsPerMonth: number; csvUpload: boolean; resumeUpload: boolean; }
interface ApplicantConfig { plan: string; maxApplications: number; maxCVUploads: number; profileHighlight: boolean; }

function buildRecruiterPlan(key: string, config: RecruiterConfig) {
  const features: string[] = [];
  const disabled: string[] = [];
  features.push(config.maxJobs === -1 ? "Unlimited job posts" : `${config.maxJobs} active job post${config.maxJobs !== 1 ? "s" : ""}`);
  features.push(config.maxScreeningsPerMonth === -1 ? "Unlimited AI screenings" : `${config.maxScreeningsPerMonth} AI screening${config.maxScreeningsPerMonth !== 1 ? "s" : ""}/month`);
  config.csvUpload ? features.push("CSV & XLSX bulk import") : disabled.push("CSV & XLSX bulk import");
  config.resumeUpload ? features.push("PDF resume bulk upload") : disabled.push("PDF resume bulk upload");
  return { features, disabled };
}

function buildApplicantPlan(key: string, config: ApplicantConfig) {
  const features: string[] = [];
  const disabled: string[] = [];
  features.push(config.maxApplications === -1 ? "Unlimited job applications" : `${config.maxApplications} job application${config.maxApplications !== 1 ? "s" : ""}/month`);
  features.push(config.maxCVUploads === -1 ? "Unlimited CV uploads" : `${config.maxCVUploads} CV upload${config.maxCVUploads !== 1 ? "s" : ""}`);
  config.profileHighlight ? features.push("Profile highlighted to recruiters") : disabled.push("Profile highlighted to recruiters");
  return { features, disabled };
}

const RECRUITER_PLANS = [
  { key: "free",       icon: Zap,      name: "Free",       monthly: 0,     yearly: 0,      desc: "For small teams getting started",            highlight: false },
  { key: "pro",        icon: Building, name: "Pro",        monthly: 10000, yearly: 80000,  desc: "For growing companies hiring regularly",     highlight: false },
  { key: "enterprise", icon: Rocket,   name: "Enterprise", monthly: 30000, yearly: 240000, desc: "For large organizations with complex needs",  highlight: true  },
];

const APPLICANT_PLANS = [
  { key: "free", icon: User, name: "Free", monthly: 0,    yearly: 0,     desc: "For job seekers getting started",       highlight: false },
  { key: "pro",  icon: Star, name: "Pro",  monthly: 5000, yearly: 40000, desc: "For serious job seekers who want more", highlight: true  },
];

function PlanCard({ plan, price, period, currentPlan, onUpgrade, onDowngrade, downgrading, features, disabled }: {
  plan: typeof RECRUITER_PLANS[0];
  price: number;
  period: string;
  currentPlan: string;
  onUpgrade: () => void;
  onDowngrade: () => void;
  downgrading: boolean;
  features: string[];
  disabled: string[];
}) {
  const isCurrentPlan = plan.key === (currentPlan || "free");
  const isFree = plan.monthly === 0;
  return (
    <div className={`glass-card p-7 flex flex-col relative ${plan.highlight ? "ring-2" : ""} ${isCurrentPlan ? "ring-2" : ""}`}
      style={isCurrentPlan ? { "--tw-ring-color": "var(--accent)" } as any : plan.highlight ? { "--tw-ring-color": "var(--accent)" } as any : {}}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-glow text-white text-xs font-bold px-4 py-1 rounded-full">
          Current Plan
        </div>
      )}
      {!isCurrentPlan && plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-glow text-white text-xs font-bold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div className="w-11 h-11 rounded-xl accent-icon-bg flex items-center justify-center mb-4">
        <plan.icon size={20} className="text-white" />
      </div>
      <p className="font-extrabold text-xl text-gray-900 dark:text-white">{plan.name}</p>
      <div className="my-3">
        {price === 0
          ? <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>Free</p>
          : <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>
              RWF {price.toLocaleString()}<span className="text-base font-normal text-gray-400">{period}</span>
            </p>
        }
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>
      <ul className="space-y-2.5 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Check size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} /> {f}
          </li>
        ))}
        {disabled.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300 dark:text-gray-600">
            <X size={14} className="shrink-0 mt-0.5 text-red-300" /> {f}
          </li>
        ))}
      </ul>
      {currentPlan ? (
        isCurrentPlan
          ? <div className="w-full text-center py-3 rounded-xl text-sm font-semibold glass-card text-gray-400 cursor-default">✓ Current Plan</div>
          : isFree
            ? <button onClick={onDowngrade} disabled={downgrading} className="w-full py-3 rounded-xl font-semibold text-sm glass-card hover:opacity-80 text-gray-500 transition disabled:opacity-50">{downgrading ? "Downgrading…" : "Downgrade to Free"}</button>
            : <button onClick={onUpgrade} className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.highlight ? "btn-glow text-white" : "glass-card hover:opacity-80 text-gray-700 dark:text-gray-300"}`}>Upgrade Now</button>
      ) : (
        isFree
          ? <Link href="/auth/register" className="w-full text-center py-3 rounded-xl font-semibold text-sm glass-card hover:opacity-80 text-gray-700 dark:text-gray-300 block">Get Started Free</Link>
          : <Link href="/auth/register" className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition block ${plan.highlight ? "btn-glow text-white" : "glass-card hover:opacity-80 text-gray-700 dark:text-gray-300"}`}>
              {plan.key === "enterprise" ? "Contact Sales" : "Start Free Trial"}
            </Link>
      )}
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [rConfigs, setRConfigs] = useState<Record<string, RecruiterConfig>>({});
  const [aConfigs, setAConfigs] = useState<Record<string, ApplicantConfig>>({});
  const [downgrading, setDowngrading] = useState(false);

  useEffect(() => {
    fetchPublicPlanConfigs()
      .then((data: RecruiterConfig[]) => {
        const map: Record<string, RecruiterConfig> = {};
        data.forEach((c) => { map[c.plan] = c; });
        setRConfigs(map);
      }).catch(() => {});
    fetchPublicApplicantPlanConfigs()
      .then((data: ApplicantConfig[]) => {
        const map: Record<string, ApplicantConfig> = {};
        data.forEach((c) => { map[c.plan] = c; });
        setAConfigs(map);
      }).catch(() => {});
  }, []);

  const handleUpgrade = (planKey: string) => {
    router.push(`/upgrade?plan=${planKey}`);
  };

  const handleDowngrade = async () => {
    if (!confirm("Downgrade to Free? You will lose access to paid features immediately.")) return;
    setDowngrading(true);
    try {
      await dispatch(upgradePlanAction({ plan: "free", billing: "monthly" })).unwrap();
      toast.success("Downgraded to Free plan.");
    } catch {
      toast.error("Downgrade failed. Please try again.");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass-card mb-5" style={{ color: "var(--accent)" }}>
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Plans for Every <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Role</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Whether you're hiring or job seeking — start free and upgrade when you need more.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${!yearly ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>Monthly</span>
          <button onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "btn-glow" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Yearly <span className="text-xs text-green-500 font-semibold">Save ~33%</span>
          </span>
        </div>
      </div>

      {/* Recruiter plans */}
      {user?.role !== "applicant" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Building size={18} style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">For Recruiters</h2>
            <span className="text-xs text-gray-400 ml-1">— post jobs & screen candidates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RECRUITER_PLANS.map((plan) => {
              const cfg = rConfigs[plan.key];
              const { features, disabled } = cfg ? buildRecruiterPlan(plan.key, cfg) : { features: [], disabled: [] };
              return (
                <PlanCard key={plan.key} plan={plan}
                  price={yearly ? plan.yearly : plan.monthly}
                  period={yearly ? "/yr" : "/mo"}
                  currentPlan={user?.plan || ""}
                  features={features}
                  disabled={disabled}
                  onUpgrade={() => handleUpgrade(plan.key === "pro" ? "recruiter_pro" : "recruiter_enterprise")}
                  onDowngrade={handleDowngrade}
                  downgrading={downgrading}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Applicant plans */}
      {user?.role !== "recruiter" && user?.role !== "admin" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <User size={18} style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">For Applicants</h2>
            <span className="text-xs text-gray-400 ml-1">— find & apply to jobs</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {APPLICANT_PLANS.map((plan) => {
              const cfg = aConfigs[plan.key];
              const { features, disabled } = cfg ? buildApplicantPlan(plan.key, cfg) : { features: [], disabled: [] };
              return (
                <PlanCard key={plan.key} plan={plan}
                  price={yearly ? plan.yearly : plan.monthly}
                  period={yearly ? "/yr" : "/mo"}
                  currentPlan={user?.plan || ""}
                  features={features}
                  disabled={disabled}
                  onUpgrade={() => handleUpgrade("applicant_pro")}
                  onDowngrade={handleDowngrade}
                  downgrading={downgrading}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Pricing FAQ</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately." },
            { q: "Is there a free trial for Pro?", a: "Yes! Pro comes with a 14-day free trial. No credit card required." },
            { q: "What payment methods do you accept?", a: "We accept Mobile Money (MTN, Airtel), bank transfer, and major credit cards." },
            { q: "Do you offer discounts for NGOs?", a: "Yes, we offer 50% discounts for registered NGOs and educational institutions. Contact us to apply." },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-sm">{q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="btn-glow rounded-3xl p-10 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-3">Still Have Questions?</h2>
        <p className="text-white/70 mb-6">Our team is happy to help you find the right plan for your needs.</p>
        <Link href="/contact" className="bg-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition" style={{ color: "var(--accent)" }}>
          Talk to Sales
        </Link>
      </div>
    </div>
  );
}
