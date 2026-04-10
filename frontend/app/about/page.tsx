"use client";
import Link from "next/link";
import { Users, Target, Globe, Award, ArrowRight, CheckCircle } from "lucide-react";

const team = [
  { name: "IRAKOZE Aime", role: "Full Stack & AI Engineer", avatar: "I" },
];

const values = [
  { icon: Target, title: "Human-First Hiring", desc: "AI assists recruiters — humans always make the final call. We believe technology should empower, not replace, human judgment." },
  { icon: Globe, title: "Built for Africa", desc: "Designed with African talent markets in mind. We understand the unique challenges and opportunities across the continent." },
  { icon: Award, title: "Transparent AI", desc: "Every AI decision comes with clear reasoning. Candidates are evaluated on skills, experience, projects, and education — nothing else." },
  { icon: Users, title: "Equal Opportunity", desc: "Our platform removes unconscious bias by focusing purely on professional qualifications and demonstrated abilities." },
];

const stats = [
  { value: "10x", label: "Faster screening" },
  { value: "95%", label: "Recruiter satisfaction" },
  { value: "50+", label: "Companies trust us" },
  { value: "1000+", label: "Candidates screened" },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-20 py-8">
      {/* Hero */}
      <div className="text-center space-y-5 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass-card" style={{ color: "var(--accent)" }}>
          <Globe size={15} /> About TalentLink Africa
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Connecting Africa's Best Talent<br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">with the Right Opportunities</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          TalentLink Africa is an AI-powered recruitment platform built to help African companies hire smarter, faster, and more fairly — while keeping humans in control of every hiring decision.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/board" className="btn-glow px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2">
            Browse Jobs <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="glass-card px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            Contact Us
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ value, label }) => (
          <div key={label} className="glass-card p-6 text-center">
            <p className="text-3xl font-extrabold mb-1" style={{ color: "var(--accent)" }}>{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="glass-card p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              We're on a mission to eliminate the inefficiencies of traditional recruitment in Africa. High application volumes, subjective evaluations, and slow processes cost companies time and talent.
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              TalentLink Africa uses Google Gemini AI to analyze candidates across four dimensions — skills, experience, projects, and education — producing ranked shortlists with clear, explainable reasoning.
            </p>
            <ul className="space-y-2">
              {["Reduce time-to-hire by up to 10x", "Eliminate unconscious bias in screening", "Give every candidate a fair, objective evaluation", "Keep recruiters in full control of final decisions"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle size={16} style={{ color: "var(--accent)" }} className="shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="btn-glow rounded-3xl p-8 text-white text-center">
              <div className="text-6xl mb-4">🌍</div>
              <p className="text-2xl font-extrabold mb-2">Built for Africa</p>
              <p className="text-white/70 text-sm">Designed with African talent markets, languages, and opportunities in mind</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-10">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl accent-icon-bg flex items-center justify-center shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-10">Meet the Team</h2>
        <div className="flex justify-center">
          {team.map(({ name, role, avatar }) => (
            <div key={name} className="glass-card p-8 text-center w-64">
              <div className="w-20 h-20 btn-glow rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white mx-auto mb-4">
                {avatar}
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="btn-glow rounded-3xl p-10 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-3">Ready to Transform Your Hiring?</h2>
        <p className="text-white/70 mb-6 max-w-lg mx-auto">Join companies across Africa using TalentLink Africa to find the best talent faster.</p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/register" className="bg-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition" style={{ color: "var(--accent)" }}>
            Get Started Free
          </Link>
          <Link href="/contact" className="bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition border border-white/30">
            Talk to Us
          </Link>
        </div>
      </div>
    </div>
  );
}
