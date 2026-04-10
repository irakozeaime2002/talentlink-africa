"use client";
import { RankedCandidate } from "../../types";
import ScoreBar from "../ui/ScoreBar";
import { X, TrendingUp, AlertTriangle, Brain, Star } from "lucide-react";

interface Props {
  candidate: RankedCandidate;
  onClose: () => void;
}

const recommendationStyle: Record<string, { bg: string; text: string; icon: string }> = {
  "Strongly Recommend": { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: "🏆" },
  "Recommend": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "✅" },
  "Consider": { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: "🤔" },
  "Do Not Recommend": { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: "❌" },
};

export default function CandidateModal({ candidate, onClose }: Props) {
  const recStyle = recommendationStyle[candidate.recommendation] || recommendationStyle["Consider"];
  const scoreColor = candidate.match_score >= 70 ? "text-green-600" : candidate.match_score >= 50 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold">{candidate.name}</h2>
            <p className="text-sm text-gray-400">Rank #{candidate.rank} · Candidate Report</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Overall score */}
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <span className={`text-6xl font-bold ${scoreColor}`}>{candidate.match_score}</span>
            <span className="text-gray-400 text-lg">/100</span>
            <p className="text-sm text-gray-500 mt-1">Overall Match Score</p>
          </div>

          {/* Score breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">Score Breakdown</h3>
            </div>
            <div className="space-y-2.5 bg-gray-50 rounded-xl p-4">
              <ScoreBar label="Skills (40%)" value={candidate.score_breakdown.skills} />
              <ScoreBar label="Experience (30%)" value={candidate.score_breakdown.experience} />
              <ScoreBar label="Projects (20%)" value={candidate.score_breakdown.projects} />
              <ScoreBar label="Education (10%)" value={candidate.score_breakdown.education} />
            </div>
          </div>

          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-green-600" />
              <h3 className="text-sm font-semibold text-green-700">Strengths</h3>
            </div>
            <ul className="space-y-1.5">
              {candidate.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-green-500 shrink-0">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps */}
          {candidate.gaps?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-red-500" />
                <h3 className="text-sm font-semibold text-red-600">Gaps / Risks</h3>
              </div>
              <ul className="space-y-1.5">
                {candidate.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2 bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-red-400 shrink-0">✗</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Reasoning */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={15} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">AI Reasoning</h3>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed border">
              {candidate.reason}
            </p>
          </div>

          {/* Recommendation */}
          <div className={`border rounded-xl p-4 ${recStyle.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{recStyle.icon}</span>
              <h3 className={`text-sm font-semibold ${recStyle.text}`}>Final Recommendation</h3>
            </div>
            <p className={`text-sm font-medium ${recStyle.text}`}>{candidate.recommendation}</p>
            <p className="text-sm text-gray-600 mt-1">{candidate.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
