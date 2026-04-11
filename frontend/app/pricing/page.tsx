"use client";
import Link from "next/link";
import { Check, Zap, Building, Rocket } from "lucide-react";

const plans = [
  {
    icon: Zap,
    name: "Free",
    price: "0",
    desc: "Perfect for small teams getting started",
    features: ["3 active job posts", "Up to 50 applications/month", "AI screening (5 runs/month)", "Basic candidate profiles", "Email support"],
    cta: "Get Started Free",
    href: "/auth/register",
    highlight: false,
  },
  {
    icon: Building,
    name: "Pro",
    price: "49,000",
    desc: "For growing companies hiring regularly",
    features: ["Unlimited job posts", "Unlimited applications", "AI screening (unlimited)", "CSV & resume bulk upload", "Custom application questions", "Priority support", "Advanced analytics"],
    cta: "Start Pro Trial",
    href: "/auth/register",
    highlight: true,
  },
  {
    icon: Rocket,
    name: "Enterprise",
    price: "Custom",
    desc: "For large organizations with complex needs",
    features: ["Everything in Pro", "Dedicated account manager", "Custom AI scoring weights", "API access", "SSO / SAML integration", "SLA guarantee", "Onboarding & training"],
    cta: "Contact Sales",
    href: "/contact",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass-card mb-5" style={{ color: "var(--accent)" }}>
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Plans for Every <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Team Size</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Start free and scale as you grow. All plans include AI-powered screening and a full recruiter dashboard.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(({ icon: Icon, name, price, desc, features, cta, href, highlight }) => (
          <div key={name} className={`glass-card p-7 flex flex-col relative ${highlight ? "ring-2" : ""}`} style={highlight ? { "--tw-ring-color": "var(--accent)" } as any : {}}>
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
              {price === "Custom" ? (
                <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>Custom</p>
              ) : (
                <p className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>
                  RWF {price}<span className="text-base font-normal text-gray-400">/mo</span>
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{desc}</p>
            <ul className="space-y-2.5 flex-1 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={15} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} /> {f}
                </li>
              ))}
            </ul>
            <Link href={href} className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition ${highlight ? "btn-glow text-white" : "glass-card hover:opacity-80 text-gray-700 dark:text-gray-300"}`}>
              {cta}
            </Link>
          </div>
        ))}
      </div>

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
