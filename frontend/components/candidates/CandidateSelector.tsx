"use client";
import { Candidate } from "../../types";
import Badge from "../ui/Badge";

interface Props {
  candidates: Candidate[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function CandidateSelector({ candidates, selected, onChange }: Props) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () =>
    onChange(selected.length === candidates.length ? [] : candidates.map((c) => c._id));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{selected.length} of {candidates.length} selected</span>
        <button onClick={toggleAll} className="text-sm text-indigo-600 hover:underline">
          {selected.length === candidates.length ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {candidates.map((c) => (
          <label
            key={c._id}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
              selected.includes(c._id) ? "border-indigo-400 bg-indigo-50" : "hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(c._id)}
              onChange={() => toggle(c._id)}
              className="accent-indigo-600"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.name}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {c.skills.slice(0, 3).map((s, i) => <Badge key={i} label={s.name} color="gray" />)}
              </div>
            </div>
            <Badge label={c.source} color={c.source === "profile" ? "blue" : c.source === "csv" ? "green" : "yellow"} />
          </label>
        ))}
      </div>
    </div>
  );
}
