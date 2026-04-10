import Link from "next/link";
import { Job } from "../../types";
import Badge from "../ui/Badge";
import { MapPin, Clock } from "lucide-react";

interface Props {
  job: Job;
  onDelete: (id: string) => void;
}

export default function JobCard({ job, onDelete }: Props) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-semibold text-lg truncate">{job.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge label={job.experience_level} color="blue" />
            <Badge label={job.status} color={job.status === "open" ? "green" : job.status === "draft" ? "yellow" : "gray"} />
          </div>
        </div>
        <div className="flex gap-2 text-sm shrink-0">
          <Link href={`/jobs/${job._id}`} className="text-indigo-600 hover:underline">View</Link>
          <Link href={`/jobs/${job._id}/edit`} className="text-gray-500 hover:underline">Edit</Link>
          <button onClick={() => onDelete(job._id)} className="text-red-500 hover:underline">Delete</button>
        </div>
      </div>

      <div className="flex gap-3 text-xs text-gray-400 mb-3">
        {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
        {job.salary_range && <span className="text-emerald-600 font-medium">RWF {job.salary_range}</span>}
        {job.deadline && <span className="flex items-center gap-1"><Clock size={11} />Due {new Date(job.deadline).toLocaleDateString()}</span>}
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>

      <div className="flex flex-wrap gap-1">
        {job.required_skills.slice(0, 5).map((s) => (
          <Badge key={s} label={s} color="gray" />
        ))}
        {job.required_skills.length > 5 && (
          <Badge label={`+${job.required_skills.length - 5}`} color="gray" />
        )}
      </div>
    </div>
  );
}
