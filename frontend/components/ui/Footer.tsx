"use client";
import Link from "next/link";
import { useAppSelector } from "../../store/hooks";
import { Github, Twitter, Linkedin, Mail, MapPin } from "lucide-react";

const FooterLink = ({ href, label }: { href: string; label: string }) => (
  <li>
    <Link href={href}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 flex items-center gap-1.5 group">
      <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "var(--accent)" }} />
      {label}
    </Link>
  </li>
);

const FooterSection = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
  <div>
    <p className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-4"
      style={{ color: "var(--accent)" }}>{title}</p>
    <ul className="space-y-2.5">
      {links.map(({ href, label }) => <FooterLink key={label} href={href} label={label} />)}
    </ul>
  </div>
);

const SOCIALS = [
  { icon: <Twitter size={15} />, href: "#", label: "Twitter" },
  { icon: <Linkedin size={15} />, href: "#", label: "LinkedIn" },
  { icon: <Github size={15} />, href: "#", label: "GitHub" },
  { icon: <Mail size={15} />, href: "/contact", label: "Email" },
];

export default function Footer() {
  const { user } = useAppSelector((s) => s.auth);
  const year = new Date().getFullYear();

  const Brand = () => (
    <div className="col-span-2 md:col-span-1 space-y-4">
      <Link href="/home" className="flex items-center gap-2.5 group w-fit">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg text-xl"
          style={{ background: "var(--accent)" }}>
          🌍
        </div>
        <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">
          TalentLink <span style={{ color: "var(--accent)" }}>Africa</span>
        </span>
      </Link>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
        AI-powered talent screening for Africa's fastest-growing companies. Hire smarter, faster, and fairer.
      </p>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <MapPin size={12} style={{ color: "var(--accent)" }} />
        Kigali, Rwanda · Remote-first
      </div>
      {/* Socials */}
      <div className="flex gap-2 pt-1">
        {SOCIALS.map(({ icon, href, label }) => (
          <Link key={label} href={href} aria-label={label}
            className="w-8 h-8 rounded-lg border dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:border-transparent"
            style={{ borderColor: "var(--card-border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            {icon}
          </Link>
        ))}
      </div>
    </div>
  );

  const wrapper = (children: React.ReactNode, userBadge?: React.ReactNode) => (
    <footer className="relative z-10 mt-16" style={{ borderTop: "1px solid var(--card-border)" }}>
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />

      <div style={{ background: "var(--nav-bg)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <Brand />
            {children}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: "1px solid var(--card-border)" }}>
            <p className="text-xs text-gray-400">
              © {year} <span className="font-semibold text-gray-600 dark:text-gray-300">TalentLink Africa</span>. All rights reserved.
            </p>
            {userBadge ?? (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <Link href="/about" className="hover:text-gray-600 dark:hover:text-gray-300 transition">About</Link>
                <span>·</span>
                <Link href="/contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Contact</Link>
                <span>·</span>
                <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Pricing</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );

  if (user?.role === "recruiter") {
    return wrapper(
      <>
        <FooterSection title="Recruitment" links={[
          { href: "/", label: "Dashboard" },
          { href: "/jobs/new", label: "Post a Job" },
          { href: "/jobs", label: "My Jobs" },
          { href: "/candidates", label: "Candidates" },
        ]} />
        <FooterSection title="Platform" links={[
          { href: "/home", label: "Home" },
          { href: "/about", label: "About" },
          { href: "/pricing", label: "Pricing" },
          { href: "/contact", label: "Contact" },
        ]} />
        <FooterSection title="Account" links={[
          { href: "/profile", label: "My Profile" },
          { href: "/contact", label: "Get Support" },
        ]} />
      </>,
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-gray-400">Signed in as</span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Recruiter</span>
      </div>
    );
  }

  if (user?.role === "applicant") {
    return wrapper(
      <>
        <FooterSection title="Jobs" links={[
          { href: "/board", label: "Browse Jobs" },
          { href: "/my-applications", label: "My Applications" },
        ]} />
        <FooterSection title="Platform" links={[
          { href: "/home", label: "Home" },
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
        ]} />
        <FooterSection title="Account" links={[
          { href: "/profile", label: "My Profile" },
          { href: "/contact", label: "Get Support" },
        ]} />
      </>,
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-gray-400">Signed in as</span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Applicant</span>
      </div>
    );
  }

  return wrapper(
    <>
      <FooterSection title="Platform" links={[
        { href: "/board", label: "Browse Jobs" },
        { href: "/auth/register", label: "Post a Job" },
        { href: "/pricing", label: "Pricing" },
      ]} />
      <FooterSection title="Company" links={[
        { href: "/about", label: "About Us" },
        { href: "/contact", label: "Contact" },
        { href: "/pricing", label: "Pricing" },
      ]} />
      <FooterSection title="Get Started" links={[
        { href: "/auth/register", label: "Sign Up Free" },
        { href: "/auth/login", label: "Sign In" },
        { href: "/board", label: "Find Jobs" },
      ]} />
    </>
  );
}
