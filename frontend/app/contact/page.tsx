"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../../lib/api";

const contacts = [
  { icon: Mail, label: "Email", value: "hello@talentlinkafrica.com", href: "mailto:hello@talentlinkafrica.com" },
  { icon: Phone, label: "Phone", value: "+250 784 664 612", href: "tel:+250784664612" },
  { icon: MapPin, label: "Location", value: "Kigali, Rwanda", href: "#" },
  { icon: Clock, label: "Response Time", value: "Within 24 hours", href: "#" },
];

const faqs = [
  { q: "Is TalentLink Africa free to use?", a: "Yes, you can create an account and start posting jobs or applying for free. Premium features are coming soon." },
  { q: "How does the screening work?", a: "Recruiters trigger screening after receiving applications. The system evaluates candidates and produces a ranked shortlist with detailed reasoning." },
  { q: "Can applicants see their scores?", a: "No. Applicants only see their application status (pending, reviewed, shortlisted, rejected). Scoring details are only visible to recruiters." },
  { q: "What file formats are supported for resume upload?", a: "We support PDF resumes and CSV/Excel files for bulk candidate imports." },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.subject) {
      toast.error("Please select a subject");
      return;
    }
    
    setSending(true);
    try {
      await api.createContactMessage(form);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium glass-card mb-5" style={{ color: "var(--accent)" }}>
          <MessageCircle size={15} /> Get in Touch
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          We'd Love to <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Hear From You</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Have a question, feedback, or want to partner with us? Reach out and our team will respond within 24 hours.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact form */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
                  style={{ "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition"
              >
                <option value="">Select a subject</option>
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Partnership</option>
                <option>Feedback</option>
                <option>Report an Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <textarea
                required rows={5} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition resize-none"
                placeholder="Tell us how we can help..."
              />
            </div>
            <button type="submit" disabled={sending} className="w-full btn-glow text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <Send size={16} /> {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact info + FAQ */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Contact Information</h2>
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl accent-icon-bg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{q}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
