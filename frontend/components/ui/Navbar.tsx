"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, Moon, Sun, Palette } from "lucide-react";
import { useState } from "react";
import { useTheme, ACCENT_COLORS } from "../../context/ThemeContext";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const { dark, toggleDark, accent, setAccent } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleLogout = () => { dispatch(logout()); router.push("/home"); };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const publicLinks = [
    { href: "/home", label: "Home" },
    { href: "/board", label: "Browse Jobs" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];

  const recruiterLinks = [
    { href: "/home", label: "Home" },
    { href: "/board", label: "Browse Jobs" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/", label: "Dashboard" },
    { href: "/jobs", label: "My Jobs" },
    { href: "/candidates", label: "Candidates" },
  ];

  const applicantLinks = [
    { href: "/home", label: "Home" },
    { href: "/board", label: "Browse Jobs" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/my-applications", label: "My Applications" },
  ];

  const links = user?.role === "recruiter" ? recruiterLinks : user?.role === "applicant" ? applicantLinks : publicLinks;
  const dashboardHref = user?.role === "recruiter" ? "/" : "/board";

  return (
    <nav className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{ background: "var(--nav-bg)", borderColor: "var(--card-border)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg btn-glow">🌍</div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            TalentLink Africa
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(href) ? "nav-active" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Palette */}
          <div className="relative">
            <button onClick={() => setPaletteOpen(!paletteOpen)} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition" title="Change accent color">
              <Palette size={16} />
            </button>
            {paletteOpen && (
              <div className="absolute right-0 top-10 glass-card p-3 w-48 z-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Theme Color</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(ACCENT_COLORS) as (keyof typeof ACCENT_COLORS)[]).map((c) => (
                    <button key={c} onClick={() => { setAccent(c); setPaletteOpen(false); }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/5`}
                      title={ACCENT_COLORS[c].label}>
                      <span className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ background: c === "default" ? "linear-gradient(135deg, #94a3b8, #64748b)" : ACCENT_COLORS[c].primary,
                          boxShadow: accent === c ? `0 0 0 3px ${ACCENT_COLORS[c].primary}` : "none" }} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{ACCENT_COLORS[c].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button onClick={toggleDark} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition" title={dark ? "Light mode" : "Dark mode"}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Guest */}
          {!user && (
            <>
              <Link href="/auth/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:opacity-80 transition">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-glow px-4 py-1.5 rounded-lg text-sm font-semibold text-white">
                Get Started
              </Link>
            </>
          )}

          {/* Logged in — avatar only */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-white/10 ml-1">
              <Link href={dashboardHref} className="flex items-center gap-2 group">
                <div className="w-8 h-8 btn-glow rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">{user.name.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
              </Link>
              <button onClick={handleLogout} title="Sign out" className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggleDark} className="p-2 text-gray-500 dark:text-gray-400">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 dark:text-gray-400">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t dark:border-white/10 px-4 py-3 space-y-1 animate-fade-in">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(href) ? "nav-active" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
              {label}
            </Link>
          ))}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm border rounded-lg dark:border-white/10">Sign In</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm btn-glow text-white rounded-lg">Get Started</Link>
            </div>
          )}
          {user && (
            <div className="flex items-center justify-between pt-2 border-t dark:border-white/10">
              <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-7 h-7 btn-glow rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name} <span className="text-xs text-gray-400 capitalize">({user.role})</span>
              </Link>
              <button onClick={handleLogout} className="text-red-500 text-xs font-medium">Sign out</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
