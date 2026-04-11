"use client";
import { RankedCandidate } from "../../types";
import ScoreBar from "../ui/ScoreBar";
import { X, TrendingUp, AlertTriangle, Brain, Star } from "lucide-react";

interface Props {
  candidate: RankedCandidate;
  onClose: () => void;
}

const REC_CONFIG: Record<string, { pill: string; icon: string }> = {
  "Strongly Recommend": { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "🏆" },
  "Recommend":          { pill: "bg-blue-100 text-blue-700 border-blue-200",           icon: "✅" },
  "Consider":           { pill: "bg-amber-100 text-amber-700 border-amber-200",         icon: "🤔" },
  "Do Not Recommend":   { pill: "bg-red-100 text-red-600 border-red-200",               icon: "❌" },
};

const scoreBg = (s: number) =>
  s >= 70 ? "from-emerald-500 to-teal-500" : s >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";

export default function CandidateModal({ candidate, onClose }: Props) {
  const rec = REC_CONFIG[candidate.recommendation] || REC_CONFIG["Consider"];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />

      {/* Side drawer — slides in from right */}
      <div
        className="relative w-full max-w-xl h-full bg-white dark:bg-[#16142a] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/10 shrink-0"
          style={{ background: "var(--nav-bg)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ background: "var(--accent)" }}>
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">{candidate.name}</h2>
              <p className="text-xs text-gray-400">Rank #{candidate.rank} · AI Screening Report</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${rec.pill}`}>
              {rec.icon} {candidate.recommendation}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Score hero */}
          <div className={`rounded-2xl p-6 text-white text-center bg-gradient-to-br ${scoreBg(candidate.match_score)} relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at top right, #fff, transparent 60%)" }} />
            <p className="text-7xl font-extrabold leading-none relative z-10">{candidate.match_score}</p>
            <p className="text-white/70 text-sm mt-1 relative z-10">out of 100 · Overall Match Score</p>
          </div>

          {/* Score breakdown */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Score Breakdown</h3>
            </div>
            <ScoreBar label="Skills (40%)" value={candidate.score_breakdown.skills} />
            <ScoreBar label="Experience (30%)" value={candidate.score_breakdown.experience} />
            <ScoreBar label="Projects (20%)" value={candidate.score_breakdown.projects} />
            <ScoreBar label="Education (10%)" value={candidate.score_breakdown.education} />
          </div>

          {/* Strengths */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {candidate.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps */}
          {candidate.gaps?.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Gaps / Risks</h3>
              </div>
              <ul className="space-y-2">
                {candidate.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
                    <span className="text-red-400 shrink-0 mt-0.5">✗</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">AI Reasoning</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{candidate.reason}</p>
          </div>

          {/* Final recommendation */}
          <div className={`rounded-2xl p-5 border flex items-center gap-4 ${rec.pill}`}>
            <span className="text-3xl">{rec.icon}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">Final Recommendation</p>
              <p className="font-extrabold text-lg">{candidate.recommendation}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
