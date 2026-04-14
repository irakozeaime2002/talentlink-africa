"use client";
import { useState, useRef, useEffect } from "react";
import { Job } from "../../types";
import { Briefcase, MapPin, Tag, ListChecks, HelpCircle, Plus, X, ChevronDown, Paperclip } from "lucide-react";

type JobFormData = Omit<Job, "_id" | "createdAt">;

interface Props {
  initial?: Partial<JobFormData>;
  onSubmit: (data: JobFormData) => void;
  loading?: boolean;
  onDirty?: () => void;
}

const empty: JobFormData = {
  title: "", organization: "", description: "", required_skills: [], preferred_skills: [],
  experience_level: "", responsibilities: [], status: "open",
  location: "", salary_range: "", deadline: "", application_questions: [], required_documents: [],
};

const INPUT = "w-full border dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 dark:text-gray-200 focus:outline-none focus:ring-2 transition-all placeholder-gray-400";
const LABEL = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";
const CHECKBOX = "w-4 h-4 rounded border-gray-300 focus:ring-2 transition-all cursor-pointer";

// Defined OUTSIDE component to prevent re-render focus loss
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-2.5 pb-3 border-b dark:border-white/10">
      <div className="w-8 h-8 rounded-lg accent-icon-bg flex items-center justify-center shrink-0">{icon}</div>
      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

interface TagInputProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
}

// Defined OUTSIDE component — this is the key fix for focus loss
const TagInput = ({ items, value, onChange, onAdd, onRemove, placeholder }: TagInputProps) => (
  <div>
    <div className="flex gap-2 mb-2">
      <input
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        placeholder={placeholder}
      />
      <button type="button" onClick={onAdd} className="px-4 py-2 rounded-xl text-white btn-glow shrink-0">
        <Plus size={16} />
      </button>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
          {item}
          <button type="button" onClick={() => onRemove(i)} className="hover:opacity-60 transition"><X size={11} /></button>
        </span>
      ))}
    </div>
  </div>
);

export default function JobForm({ initial = {}, onSubmit, loading, onDirty }: Props) {
  const [form, setForm] = useState<JobFormData>({ ...empty, ...initial });
  const [skillInput, setSkillInput] = useState("");
  const [prefInput, setPrefInput] = useState("");
  const [respInput, setRespInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [docInput, setDocInput] = useState("");
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form.description]);

  const update = (updater: (f: JobFormData) => JobFormData) => {
    setForm(updater);
    onDirty?.();
  };

  const addToArray = (field: keyof JobFormData, value: string, clear: () => void) => {
    if (!value.trim()) return;
    update((f) => ({ ...f, [field]: [...(f[field] as string[]), value.trim()] }));
    clear();
  };

  const removeFromArray = (field: keyof JobFormData, index: number) => {
    update((f) => ({ ...f, [field]: (f[field] as string[]).filter((_, i) => i !== index) }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">

      {/* Basic Info */}
      <Section icon={<Briefcase size={16} className="text-white" />} title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Job Title <span className="text-red-400">*</span></label>
            <input className={INPUT} required value={form.title}
              onChange={(e) => update((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Senior Frontend Developer" />
          </div>
          <div>
            <label className={LABEL}>Organization Name</label>
            <input className={INPUT} value={form.organization || ""}
              onChange={(e) => update((f) => ({ ...f, organization: e.target.value }))}
              placeholder="e.g. Umurava, MTN Rwanda" />
          </div>
          <div>
            <label className={LABEL}>Experience Level <span className="text-red-400">*</span></label>
            <div className="relative">
              <select className={`${INPUT} appearance-none pr-10`} required value={form.experience_level}
                onChange={(e) => update((f) => ({ ...f, experience_level: e.target.value }))}>
                <option value="">Select level</option>
                {["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "open", label: "Open", desc: "Visible" },
                { value: "draft", label: "Draft", desc: "Hidden" },
                { value: "closed", label: "Closed", desc: "No apps" },
              ].map(({ value, label, desc }) => (
                <button key={value} type="button"
                  onClick={() => update((f) => ({ ...f, status: value as Job["status"] }))}
                  className="p-2.5 rounded-xl border-2 text-left transition-all"
                  style={form.status === value ? { borderColor: "var(--accent)", background: "var(--accent-light)" } : { borderColor: "transparent" }}
                >
                  <p className="text-xs font-bold" style={form.status === value ? { color: "var(--accent)" } : { color: "#6b7280" }}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={LABEL}>Job Description <span className="text-red-400">*</span></label>
          <textarea ref={descRef} rows={4} required value={form.description}
            onChange={(e) => update((f) => ({ ...f, description: e.target.value }))}
            className={`${INPUT} resize-none overflow-hidden`}
            placeholder="Describe the role, what the team does, and what makes this opportunity exciting..." />
        </div>
      </Section>

      {/* Location & Compensation */}
      <Section icon={<MapPin size={16} className="text-white" />} title="Location & Compensation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Location</label>
            <input className={INPUT} value={form.location}
              onChange={(e) => update((f) => ({ ...f, location: e.target.value }))}
              placeholder="Remote / Kigali, RW" />
          </div>
          <div>
            <label className={LABEL}>Salary Range <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">RWF</span>
              <input className={`${INPUT} pl-12`} value={form.salary_range}
                onChange={(e) => update((f) => ({ ...f, salary_range: e.target.value }))}
                placeholder="300,000 – 600,000" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Application Deadline</label>
            <input type="date" className={INPUT}
              value={form.deadline ? form.deadline.slice(0, 10) : ""}
              onChange={(e) => update((f) => ({ ...f, deadline: e.target.value }))} />
          </div>
        </div>
      </Section>

      {/* Skills */}
      <Section icon={<Tag size={16} className="text-white" />} title="Skills">
        <div>
          <label className={LABEL}>Required Skills</label>
          <TagInput
            items={form.required_skills} value={skillInput}
            onChange={setSkillInput}
            onAdd={() => addToArray("required_skills", skillInput, () => setSkillInput(""))}
            onRemove={(i) => removeFromArray("required_skills", i)}
            placeholder="e.g. React, TypeScript — press Enter"
          />
        </div>
        <div>
          <label className={LABEL}>Preferred Skills <span className="text-gray-400 font-normal">(optional)</span></label>
          <TagInput
            items={form.preferred_skills} value={prefInput}
            onChange={setPrefInput}
            onAdd={() => addToArray("preferred_skills", prefInput, () => setPrefInput(""))}
            onRemove={(i) => removeFromArray("preferred_skills", i)}
            placeholder="e.g. Docker, AWS — press Enter"
          />
        </div>
      </Section>

      {/* Responsibilities */}
      <Section icon={<ListChecks size={16} className="text-white" />} title="Responsibilities">
        <TagInput
          items={form.responsibilities} value={respInput}
          onChange={setRespInput}
          onAdd={() => addToArray("responsibilities", respInput, () => setRespInput(""))}
          onRemove={(i) => removeFromArray("responsibilities", i)}
          placeholder="e.g. Build and maintain REST APIs — press Enter"
        />
      </Section>

      {/* Required Documents */}
      <Section icon={<Paperclip size={16} className="text-white" />} title="Required Documents (optional)">
        <p className="text-xs text-gray-400 -mt-2">Applicants will be prompted to upload these files. PDFs will be parsed by AI during screening.</p>
        <div className="flex gap-2 mb-3">
          <input className={INPUT} value={docInput}
            onChange={(e) => setDocInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (docInput.trim()) { update((f) => ({ ...f, required_documents: [...(f.required_documents || []).map(d => typeof d === 'string' ? { name: d, optional: false } : d), { name: docInput.trim(), optional: false }] as { name: string; optional: boolean }[] })); setDocInput(""); } } }}
            placeholder="e.g. Resume, Portfolio, Certificate — press Enter" />
          <button type="button" onClick={() => { if (docInput.trim()) { update((f) => ({ ...f, required_documents: [...(f.required_documents || []).map(d => typeof d === 'string' ? { name: d, optional: false } : d), { name: docInput.trim(), optional: false }] as { name: string; optional: boolean }[] })); setDocInput(""); } }}
            className="px-4 py-2 rounded-xl text-white btn-glow shrink-0">
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {(form.required_documents || []).map((d, i) => {
            const doc = typeof d === 'string' ? { name: d, optional: false } : d;
            return (
              <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--accent-light)" }}>
                <div className="flex items-center gap-3 flex-1">
                  <Paperclip size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ color: "var(--accent)" }}>{doc.name}</span>
                  <label className="flex items-center gap-2 ml-auto cursor-pointer">
                    <input type="checkbox" className={CHECKBOX}
                      style={{ accentColor: "var(--accent)" }}
                      checked={doc.optional}
                      onChange={(e) => {
                        update((f) => ({
                          ...f,
                          required_documents: f.required_documents.map((item, idx) => {
                            if (idx === i) {
                              const current = typeof item === 'string' ? { name: item, optional: false } : item;
                              return { ...current, optional: e.target.checked };
                            }
                            return typeof item === 'string' ? { name: item, optional: false } : item;
                          }) as { name: string; optional: boolean }[]
                        }));
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--accent)" }}>Optional</span>
                  </label>
                </div>
                <button type="button" onClick={() => removeFromArray("required_documents", i)}
                  className="text-red-400 hover:text-red-600 transition ml-3 shrink-0">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Custom Questions */}
      <Section icon={<HelpCircle size={16} className="text-white" />} title="Custom Application Questions (optional)">
        <div className="flex gap-2 mb-3">
          <input className={INPUT} value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToArray("application_questions", questionInput, () => setQuestionInput("")); } }}
            placeholder="e.g. Why do you want to work here?" />
          <button type="button" onClick={() => addToArray("application_questions", questionInput, () => setQuestionInput(""))}
            className="px-4 py-2 rounded-xl text-white btn-glow shrink-0">
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {(form.application_questions || []).map((q, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--accent-light)" }}>
              <span style={{ color: "var(--accent)" }}>{i + 1}. {q}</span>
              <button type="button" onClick={() => removeFromArray("application_questions", i)}
                className="text-red-400 hover:text-red-600 transition ml-3 shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <button type="submit" disabled={loading}
        className="w-full btn-glow text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
        ) : "Save Job"}
      </button>
    </form>
  );
}
