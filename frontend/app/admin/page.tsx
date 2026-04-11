"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminGetStats } from "../../lib/api";
import { Users, Briefcase, FileText, Brain, TrendingUp, Shield, Plus, Settings, Crown, CreditCard } from "lucide-react";

interface Stats {
  totalUsers: number; totalJobs: number; totalApplications: number;
  totalCandidates: number; totalScreenings: number;
  recruiters: number; applicants: number; openJobs: number; shortlisted: number;
  recentActivity: { newUsers: number; newJobs: number; newApplications: number };
}

export default function AdminDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "admin") { router.push("/"); return; }
    adminGetStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers, sub: `${stats.recruiters} recruiters · ${stats.applicants} applicants`, icon: Users, color: "from-indigo-500 to-blue-500" },
    { label: "Total Jobs", value: stats.totalJobs, sub: `${stats.openJobs} open`, icon: Briefcase, color: "from-emerald-500 to-teal-500" },
    { label: "Applications", value: stats.totalApplications, sub: `${stats.shortlisted} shortlisted`, icon: FileText, color: "from-violet-500 to-purple-500" },
    { label: "AI Screenings", value: stats.totalScreenings, sub: `${stats.totalCandidates} candidates`, icon: Brain, color: "from-amber-500 to-orange-500" },
  ] : [];

  const navCards = [
    { href: "/admin/users", icon: Users, title: "Manage Users", desc: "View, edit, delete users and reset passwords", color: "from-indigo-500 to-blue-500" },
    { href: "/admin/jobs", icon: Briefcase, title: "Manage Jobs", desc: "View all jobs, change status, delete listings", color: "from-emerald-500 to-teal-500" },
    { href: "/admin/applications", icon: FileText, title: "Applications", desc: "Monitor all applications across the platform", color: "from-violet-500 to-purple-500" },
    { href: "/admin/users?createAdmin=1", icon: Plus, title: "Create Admin", desc: "Add a new admin account to the platform", color: "from-rose-500 to-pink-500" },
    { href: "/admin/plans", icon: Crown, title: "Plan Controls", desc: "Set feature limits per plan (jobs, screenings, uploads)", color: "from-amber-500 to-orange-500" },
    { href: "/admin/subscriptions", icon: CreditCard, title: "Subscriptions", desc: "View and manage recruiter plan assignments", color: "from-teal-500 to-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="btn-glow rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-white/80" />
              <span className="text-white/80 text-sm font-medium">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold mb-1">Platform Control Center</h1>
            <p className="text-white/70">Welcome back, {user.name}. Here's your platform overview.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/admin/users?createAdmin=1" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition border border-white/20">
              <Plus size={15} /> New Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {stats && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            <h2 className="font-bold text-gray-900 dark:text-white">Last 7 Days</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "New Users", value: stats.recentActivity.newUsers },
              { label: "New Jobs", value: stats.recentActivity.newJobs },
              { label: "New Applications", value: stats.recentActivity.newApplications },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 rounded-xl" style={{ background: "var(--accent-light)" }}>
                <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navCards.map(({ href, icon: Icon, title, desc, color }) => (
            <Link key={href} href={href} className="glass-card p-5 flex items-start gap-4 group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
