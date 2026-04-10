"use client";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../../store/hooks";
import { addJob } from "../../../store/slices/jobsSlice";
import JobForm from "../../../components/jobs/JobForm";
import toast from "react-hot-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { Job } from "../../../types";
import { ArrowLeft } from "lucide-react";

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const isDirtyRef = useRef(false);
  const savedRef = useRef(false);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { savedRef.current = saved; }, [saved]);

  // Warn on browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !savedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const handlePopState = () => {
      if (isDirtyRef.current && !savedRef.current) {
        window.history.pushState(null, "", window.location.href);
        const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
        if (confirmed) {
          window.removeEventListener("popstate", handlePopState);
          window.history.back();
        }
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBack = useCallback(() => {
    if (isDirty && !saved) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave? Your job will not be saved."
      );
      if (!confirmed) return;
    }
    router.push("/jobs");
  }, [isDirty, saved, router]);

  const handleSubmit = async (data: Omit<Job, "_id" | "createdAt">) => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      await dispatch(addJob(data)).unwrap();
      setSaved(true);
      setIsDirty(false);
      toast.success("Job created!");
      router.push("/jobs");
    } catch {
      toast.error("Failed to create job");
      submitting.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm transition"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Job</h1>
        {isDirty && !saved && (
          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            Unsaved changes
          </span>
        )}
      </div>
      <div className="glass-card p-6">
        <JobForm onSubmit={handleSubmit} loading={loading} onDirty={() => setIsDirty(true)} />
      </div>
    </div>
  );
}
