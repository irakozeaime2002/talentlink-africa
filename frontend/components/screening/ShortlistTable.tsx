"use client";
import { useState } from "react";
import { RankedCandidate } from "../../types";
import CandidateModal from "./CandidateModal";
import ScoreBar from "../ui/ScoreBar";

interface Props {
  ranking: RankedCandidate[];
}

const recommendationColor: Record<string, string> = {
  "Strongly Recommend": "bg-green-100 text-green-700 border-green-200",
  "Recommend": "bg-blue-100 text-blue-700 border-blue-200",
  "Consider": "bg-amber-100 text-amber-700 border-amber-200",
  "Do Not Recommend": "bg-red-100 text-red-600 border-red-200",
};

export default function ShortlistTable({ ranking }: Props) {
  const [selected, setSelected] = useState<RankedCandidate | null>(null);

  const scoreColor = (s: number) =>
    s >= 70 ? "text-green-600" : s >= 50 ? "text-yellow-600" : "text-red-500";

  const scoreBg = (s: number) =>
    s >= 70 ? "bg-green-50 border-green-200" : s >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Strongly Recommend", count: ranking.filter((c) => c.recommendation === "Strongly Recommend").length, color: "text-green-700 bg-green-50 border-green-200", icon: "🏆" },
          { label: "Recommend", count: ranking.filter((c) => c.recommendation === "Recommend").length, color: "text-blue-700 bg-blue-50 border-blue-200", icon: "✅" },
          { label: "Consider / Pass", count: ranking.filter((c) => ["Consider", "Do Not Recommend"].includes(c.recommendation)).length, color: "text-amber-700 bg-amber-50 border-amber-200", icon: "🤔" },
        ].map(({ label, count, color, icon }) => (
          <div key={label} className={`border rounded-2xl p-4 text-center ${color}`}>
            <div className="text-xl mb-1">{icon}</div>
            <p className="text-2xl font-extrabold">{count}</p>
            <p className="text-xs font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Candidate</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Breakdown</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Top Strength</th>
              <th className="px-4 py-3 text-left">Recommendation</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranking.map((c) => (
              <tr key={c.candidate_id} className="hover:bg-indigo-50/30 transition">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold border ${scoreBg(c.match_score)}`}>
                    {c.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">#{c.candidate_id.slice(-6)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-2xl font-extrabold ${scoreColor(c.match_score)}`}>{c.match_score}</span>
                  <span className="text-gray-400 text-xs">/100</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell w-48">
                  <div className="space-y-1">
                    <ScoreBar label="Skills" value={c.score_breakdown.skills} />
                    <ScoreBar label="Exp." value={c.score_breakdown.experience} />
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                  <p className="text-gray-600 text-xs line-clamp-2">{c.strengths?.[0] || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap border ${recommendationColor[c.recommendation] || "bg-gray-100 text-gray-600"}`}>
                    {c.recommendation}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold whitespace-nowrap hover:underline">
                    Full Report →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
