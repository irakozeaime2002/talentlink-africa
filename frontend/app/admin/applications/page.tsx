"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useRouter } from "next/navigation";
import { adminGetApplications } from "../../../lib/api";
import toast from "react-hot-toast";
import { Clock } from "lucide-react";

interface Application {
  _id: string;
  applicant_id: { name: string; email: string };
  job_id: { title: string; organization?: string };
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  reviewed:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shortlisted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminApplicationsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    load();
  }, [user, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetApplications({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setApplications(data.applications);
      setTotal(data.total);
    } catch { toast.error("Failed to load applications"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Applications</h1>
        <p className="text-gray-500 text-sm mt-0.5">{total} total applications</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "reviewed", "shortlisted", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition capitalize ${
              statusFilter === s
                ? "border-transparent text-white btn-glow"
                : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-white/10">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">Applicant</th>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{app.applicant_id?.name}</p>
                    <p className="text-xs text-gray-400">{app.applicant_id?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{app.job_id?.title}</p>
                    {app.job_id?.organization && (
                      <p className="text-xs text-gray-400">{app.job_id.organization}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[app.status] || ""}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
