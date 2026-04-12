"use client";
import Link from "next/link";
import { Check, Zap, Building, Rocket, User, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchPublicPlanConfigs, fetchPublicApplicantPlanConfigs } from "../../lib/api";
import { useAppSelector } from "../../store/hooks";

interface RecruiterConfig { plan: string; maxJobs: number; maxScreeningsPerMonth: number; csvUpload: boolean; resumeUpload: boolean; }
interface ApplicantConfig { plan: string; maxApplications: number; maxCVUploads: number; profileHighlight: boolean; }

const RECRUITER_META = {
  free:       { icon: Zap,      name: "Free",       monthly: 0,     yearly: 0,      desc: "For small teams getting started",           cta: "Get Started Free", href: "/auth/register", highlight: false },
  pro:        { icon: Building, name: "Pro",        monthly: 10000, yearly: 80000,  desc: "For growing companies hiring regularly",    cta: "Start Pro Trial",  href: "/auth/register", highlight: false },
  enterprise: { icon: Rocket,   name: "Enterprise", monthly: 30000, yearly: 240000, desc: "For large organizations with complex needs", cta: "Upgrade to Enterprise", href: "/auth/register", highlight: true },
};

const APPLICANT_META = {
  free: { icon: User, name: "Free",     monthly: 0,    yearly: 0,     desc: "For job seekers getting started",        cta: "Sign Up Free",   href: "/auth/register", highlight: false },
  pro:  { icon: Star, name: "Pro",      monthly: 5000, yearly: 40000, desc: "For serious job seekers who want more",  cta: "Upgrade to Pro", href: "/auth/register", highlight: true  },
};

function buildRecruiterFeatures(c: RecruiterConfig): string[] {
  return [
    c.maxJobs === -1 ? "✓ Job posts — Unlimited" : `✓ Job posts — ${c.maxJobs}`,
    c.maxScreeningsPerMonth === -1 ? "✓ AI screening — Unlimited/month" : `✓ AI screening — ${c.maxScreeningsPerMonth}/month`,
    c.csvUpload ? "✓ CSV & XLSX bulk import" : "✗ CSV & XLSX bulk import",
    c.resumeUpload ? "✓ PDF resume bulk upload" : "✗ PDF resume bulk upload",
  ];
}

function buildApplicantFeatures(c: ApplicantConfig): string[] {
  return [
    c.maxApplications === -1 ? "✓ Job applications — Unlimited" : `✓ Job applications — ${c.maxApplications}`,
    c.maxCVUploads === -1 ? "✓ CV uploads — Unlimited" : `✓ CV uploads — ${c.maxCVUploads}`,
    c.profileHighlight ? "✓ Profile highlighted to recruiters" : "✗ Profile highlighted to recruiters",
  ];
}

function PlanCard({ icon: Icon, name, price, period, desc, features, cta, href, highlight }: any) {
  return (
    <div className={`glass-card p-7 flex flex-col relative ${highlight ? "ring-2" : ""}`} style={highlight ? { "--tw-ring-color": "var(--accent)" } as any : {}}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-glow text-white text-xs font-bold px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <div className="w-11 h-11 rounded-xl accent-icon-bg flex items-center justify-center mb-4">
        <Icon size={20} className="text-white" />
      </div>
      <p className="font-extrabold text-xl text-gray-900 dark:text-white">{name}</p>
      <div className="my-3">
        {price === 0 ? (
          <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>Free</p>
        ) : (
          <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>
            RWF {price.toLocaleString()}<span className="text-base font-normal text-gray-400">{period}</span>
          </p>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{desc}</p>
      <ul className="space-y-2.5 flex-1 mb-8">
        {features.map((f: string) => {
          const disabled = f.startsWith("✗");
          return (
            <li key={f} className={`flex items-start gap-2 text-sm ${disabled ? "text-gray-300 dark:text-gray-600" : "text-gray-600 dark:text-gray-300"}`}>
              <span className="shrink-0 mt-0.5 font-bold" style={disabled ? { color: "#fca5a5" } : { color: "var(--accent)" }}>
                {disabled ? "✗" : "✓"}
              </span>
              {f.slice(2)}
            </li>
          );
        })}
      </ul>
      <Link href={href} className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition ${highlight ? "btn-glow text-white" : "glass-card hover:opacity-80 text-gray-700 dark:text-gray-300"}`}>
        {cta}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [yearly, setYearly] = useState(false);
  const [recruiterConfigs, setRecruiterConfigs] = useState<Record<string, RecruiterConfig> | null>(null);
  const [applicantConfigs, setApplicantConfigs] = useState<Record<string, ApplicantConfig> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPublicPlanConfigs(), fetchPublicApplicantPlanConfigs()])
      .then(([rData, aData]) => {
        const rMap: Record<string, RecruiterConfig> = {};
        rData.forEach((c: RecruiterConfig) => { rMap[c.plan] = c; });
        setRecruiterConfigs(rMap);
        const aMap: Record<string, ApplicantConfig> = {};
        aData.forEach((c: ApplicantConfig) => { aMap[c.plan] = c; });
        setApplicantConfigs(aMap);
      })
      .catch(() => {
        setRecruiterConfigs({ free: { plan: "free", maxJobs: 3, maxScreeningsPerMonth: 5, csvUpload: false, resumeUpload: false }, pro: { plan: "pro", maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true, resumeUpload: true }, enterprise: { plan: "enterprise", maxJobs: -1, maxScreeningsPerMonth: -1, csvUpload: true, resumeUpload: true } });
        setApplicantConfigs({ free: { plan: "free", maxApplications: 5, maxCVUploads: 1, profileHighlight: false }, pro: { plan: "pro", maxApplications: -1, maxCVUploads: -1, profileHighlight: true } });
      })
      .finally(() => setLoading(false));
  }, []);

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
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${!yearly ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>Monthly</span>
          <button onClick={() => setYearly(!yearly)} className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "btn-glow" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Yearly <span className="text-xs text-green-500 font-semibold">Save ~33%</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => <div key={i} className="glass-card p-7 h-80 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Recruiter Plans — show for recruiters, admins, and public (not logged in) */}
          {user?.role !== "applicant" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Building size={18} style={{ color: "var(--accent)" }} />
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">For Recruiters</h2>
                <span className="text-xs text-gray-400 ml-1">— post jobs & screen candidates</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(["free", "pro", "enterprise"] as const).map((key) => {
                  const meta = RECRUITER_META[key];
                  const config = recruiterConfigs?.[key];
                  return config ? (
                    <PlanCard key={key} {...meta} icon={meta.icon}
                      price={yearly ? meta.yearly : meta.monthly}
                      period={yearly ? "/yr" : "/mo"}
                      features={buildRecruiterFeatures(config)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Applicant Plans — show for applicants, and public (not logged in) */}
          {user?.role !== "recruiter" && user?.role !== "admin" && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <User size={18} style={{ color: "var(--accent)" }} />
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">For Applicants</h2>
                <span className="text-xs text-gray-400 ml-1">— find & apply to jobs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {(["free", "pro"] as const).map((key) => {
                  const meta = APPLICANT_META[key];
                  const config = applicantConfigs?.[key];
                  return config ? (
                    <PlanCard key={key} {...meta} icon={meta.icon}
                      price={yearly ? meta.yearly : meta.monthly}
                      period={yearly ? "/yr" : "/mo"}
                      features={buildApplicantFeatures(config)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
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
