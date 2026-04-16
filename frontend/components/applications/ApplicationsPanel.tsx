"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadJobApplications } from "../../store/slices/applicationsSlice";
import { Application, User } from "../../types";
import { Users, ChevronRight } from "lucide-react";
import * as api from "../../lib/api";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  reviewed:    { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
  shortlisted: { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  rejected:    { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400" },
};

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600", "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",  "from-sky-500 to-cyan-600",
];
const avatarGradient = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function ApplicationsPanel({ jobId }: { jobId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading } = useAppSelector((s) => s.applications);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    dispatch(loadJobApplications({ jobId, page: 1, limit: 50 })).then((result: any) => {
      if (result.payload) {
        setAllApplications(result.payload.data);
        setCurrentPage(1);
        // Check if there's more data
        api.fetchJobApplications(jobId, 1, 50).then(response => {
          setHasMore(response.pagination.hasMore);
        });
      }
    });
  }, [dispatch, jobId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const response = await api.fetchJobApplications(jobId, currentPage + 1, 50);
      setAllApplications(prev => [...prev, ...response.applications]);
      setCurrentPage(prev => prev + 1);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load more applications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, currentPage]);

  const statusCounts = {
    total: allApplications.length,
    shortlisted: allApplications.filter((a) => a.status === "shortlisted").length,
    pending: allApplications.filter((a) => a.status === "pending").length,
  };

  if (loading) return (
    <div className="text-center py-8">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-400">Loading applications...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Applications</h2>
        <div className="flex gap-2 text-xs font-medium">
          <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">{statusCounts.total} total</span>
          {statusCounts.shortlisted > 0 && <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">{statusCounts.shortlisted} shortlisted</span>}
          {statusCounts.pending > 0 && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">{statusCounts.pending} pending</span>}
        </div>
      </div>

      {allApplications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-500">No applications yet</p>
          <p className="text-sm mt-1">Share the job link to start receiving applications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {allApplications.map((app: Application) => {
            const applicant = app.applicant_id as User;
            const name = typeof applicant === "object" ? applicant.name : "Applicant";
            const email = typeof applicant === "object" ? applicant.email : "";
            const cfg = STATUS_CONFIG[app.status];

            return (
              <button
                key={app._id}
                onClick={() => router.push(`/applications/${app._id}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                    {name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} capitalize`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{email}</p>
                    {app.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.skills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{typeof s === 'string' ? s : s.name}</span>
                        ))}
                        {app.skills.length > 4 && <span className="text-xs text-gray-400">+{app.skills.length - 4}</span>}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-indigo-500 font-medium mt-0.5">View →</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
          
          {/* Sentinel element for infinite scroll */}
          {hasMore && <div ref={sentinelRef} className="h-4" />}
          
          {/* Loading indicator */}
          {loadingMore && (
            <div className="text-center py-3">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Loading more applications...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
