"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { registerUser } from "../../../store/slices/authSlice";
import toast from "react-hot-toast";
import { Mail, Lock, User, Briefcase, Users, ArrowRight, Zap, BarChart2 } from "lucide-react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TalentLink Africa";
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "AI-powered recruitment screening built for Africa";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "applicant" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await dispatch(registerUser(form)).unwrap();
      toast.success(`Welcome, ${res.user.name}! 🎉`);
      router.replace(res.user.role === "recruiter" ? "/" : "/board");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">

        {/* Left panel — uses theme dark bg */}
        <div
          className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f0c29 0%, var(--accent) 50%, #0d0d1a 100%)" }}
        >
          {/* Glow blobs */}
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--auth-blob-1, rgba(167,139,250,0.5)) 0%, transparent 65%)" }} />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--auth-blob-2, rgba(56,189,248,0.4)) 0%, transparent 65%)" }} />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--auth-blob-3, rgba(244,114,182,0.25)) 0%, transparent 65%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-10">
              <span className="text-2xl">🌍</span>
              <span className="font-extrabold text-lg tracking-tight">{APP_NAME}</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4 tracking-tight">
              Join thousands of<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #fff, var(--accent))" }}>
                African professionals
              </span>
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">Smart talent screening built for Africa</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            {[
              { icon: <Zap size={20} />, label: "Smart Matching", desc: "Intelligent candidate ranking" },
              { icon: <BarChart2 size={20} />, label: "Skill Scoring", desc: "Weighted multi-dimension scores" },
              { icon: <Briefcase size={20} />, label: "Fast Hiring", desc: "Shortlist top talent instantly" },
              { icon: <Users size={20} />, label: "Pan-Africa", desc: "Built for African professionals" },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="btn-glow w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white">{icon}</div>
                <p className="text-sm font-bold text-white mb-1">{label}</p>
                <p className="text-xs text-white/80 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — uses theme card bg */}
        <div className="glass-card rounded-none p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Create your account</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Already have one?{" "}
              <Link href="/auth/login" className="font-medium hover:underline accent-text">Sign in</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { role: "applicant", icon: Users, label: "Job Seeker", desc: "Find & apply to jobs" },
              { role: "recruiter", icon: Briefcase, label: "Recruiter", desc: "Post jobs & screen talent" },
            ] as const).map(({ role, icon: Icon, label, desc }) => (
              <button
                key={role} type="button"
                onClick={() => setForm({ ...form, role })}
                className="p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: form.role === role ? "var(--accent)" : "var(--card-border)",
                  background: form.role === role ? "var(--accent-light, #eef2ff)" : "transparent",
                }}
              >
                <Icon size={18} className="mb-1" style={{ color: form.role === role ? "var(--accent)" : "var(--text-secondary)" }} />
                <p className="text-sm font-semibold" style={{ color: form.role === role ? "var(--accent)" : "var(--text-primary)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-glow text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition"
            >
              {loading ? "Creating account…" : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
