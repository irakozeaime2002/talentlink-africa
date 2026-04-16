"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { loginUser } from "../../../store/slices/authSlice";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, Zap, Users, BarChart2 } from "lucide-react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TalentLink Africa";
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "AI-powered recruitment screening built for Africa";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await dispatch(loginUser(form)).unwrap();
      toast.success(`Welcome back, ${res.user.name}!`);
      const { role } = res.user;
      const dest = role === "admin" ? "/admin" : role === "recruiter" ? "/" : "/board";
      router.replace(dest);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
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
              Your next opportunity<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #fff, var(--accent))" }}>
                is waiting
              </span>
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">Smart talent screening built for Africa</p>
          </div>

          <div className="relative z-10 space-y-3">
            {[
              { icon: <Zap size={14} />, label: "Smart screening" },
              { icon: <BarChart2 size={14} />, label: "Instant skill matching" },
              { icon: <Users size={14} />, label: "Transparent scoring" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center btn-glow">{icon}</div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — uses theme card bg */}
        <div className="glass-card rounded-none p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Sign in</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-medium hover:underline accent-text">Create one</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  style={{ "--tw-ring-color": "var(--accent)" } as any}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                Forgot password?
              </Link>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-glow text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition mt-2"
            >
              {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
