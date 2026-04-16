"use client";
import Link from "next/link";
import { useAppSelector } from "../../store/hooks";
import { Briefcase, Users, Brain, ArrowRight, Sparkles, CheckCircle, Star } from "lucide-react";

export default function PublicHomePage() {
  const { user } = useAppSelector((s) => s.auth);

  const ctaHref = user?.role === "recruiter" ? "/" : user?.role === "applicant" ? "/board" : "/auth/register";
  const ctaLabel = user?.role === "recruiter" ? "Go to Dashboard" : user?.role === "applicant" ? "Browse Jobs" : "Get Started Free";

  return (
    <div className="space-y-24 py-4">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden px-8 py-20 text-center"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, var(--accent) 50%, #0d0d1a 100%)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
            <Sparkles size={13} className="text-yellow-300" /> Smart Screening · Built for Africa
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
            🌍 TalentLink <span className="bg-gradient-to-r from-white/80 to-white/50 bg-clip-text text-transparent">Africa</span>
          </h1>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Connecting Africa's best talent with the right opportunities — smart screening, driven by humans.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={ctaHref} className="bg-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition shadow-lg hover:scale-105 duration-200 flex items-center gap-2" style={{ color: "var(--accent)" }}>
              {ctaLabel} <ArrowRight size={16} />
            </Link>
            <Link href="/board" className="bg-white/15 backdrop-blur-sm text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/25 transition border border-white/20">
              Browse Jobs
            </Link>
          </div>
          {user && (
            <p className="text-white/50 text-sm mt-5">
              Logged in as <span className="text-white/80 font-medium">{user.name}</span> · <span className="capitalize">{user.role}</span>
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Everything You Need to Hire Smarter</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">From job posting to ranked shortlists — all in one platform.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Briefcase, title: "Post & Manage Jobs", desc: "Create listings with custom requirements, questions, deadlines, and salary in RWF." },
            { icon: Brain, title: "Smart Screening", desc: "Intelligent ranking of candidates by skills, experience, projects & education with full reasoning." },
            { icon: Users, title: "Ranked Shortlists", desc: "Get Top 10 or 20 candidates with strengths, gaps, and hiring recommendations." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-7 text-left group">
              <div className="w-12 h-12 rounded-xl accent-icon-bg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Icon size={22} className="text-white" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-2">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card p-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="font-bold mb-4 text-lg" style={{ color: "var(--accent)" }}>For Recruiters</p>
            <ul className="space-y-3">
              {["Create a job with skills, experience level & questions", "Receive applications from qualified candidates", "Click 'Screen Candidates' to rank all applicants", "Review ranked shortlist with detailed reasoning per candidate", "Make your final hiring decision"].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 accent-icon-bg">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold mb-4 text-lg" style={{ color: "var(--accent)" }}>For Job Seekers</p>
            <ul className="space-y-3">
              {["Create your account as an applicant", "Complete your professional profile once (skills, experience, education)", "Browse open jobs across Africa", "Apply with one click — your profile auto-attaches", "Track your application status in real time"].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 accent-icon-bg">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-10">Trusted Across Africa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Amina K.", role: "HR Manager, Nairobi", text: "TalentLink Africa cut our screening time from 3 days to 30 minutes. The intelligent ranking is incredibly transparent." },
            { name: "Jean-Paul M.", role: "Software Engineer, Kigali", text: "I got shortlisted for my dream job within 2 days of applying. The profile system is so easy to use." },
            { name: "Fatima O.", role: "Recruiter, Lagos", text: "The ranked shortlists with strengths and gaps per candidate changed how we hire. Highly recommend." },
          ].map(({ name, role, text }) => (
            <div key={name} className="glass-card p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">"{text}"</p>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-400">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why choose us */}
      <div className="glass-card p-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8">Why TalentLink Africa?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            "Human-first — technology assists, humans decide",
            "Transparent scoring with full reasoning",
            "Built specifically for African talent markets",
            "Supports CSV, PDF resume & structured profiles",
            "Dark mode & customizable accent colors",
            "Free to get started — no credit card needed",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle size={16} className="shrink-0" style={{ color: "var(--accent)" }} /> {item}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="btn-glow rounded-3xl p-12 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-3">Ready to Transform Your Hiring?</h2>
        <p className="text-white/70 mb-8 max-w-lg mx-auto">Join companies and professionals across Africa using TalentLink Africa.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {!user ? (
            <>
              <Link href="/auth/register" className="bg-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition" style={{ color: "var(--accent)" }}>
                Get Started Free
              </Link>
              <Link href="/auth/login" className="bg-white/20 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/30 transition border border-white/30">
                Sign In
              </Link>
            </>
          ) : (
            <Link href={ctaHref} className="bg-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition flex items-center gap-2" style={{ color: "var(--accent)" }}>
              {ctaLabel} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
