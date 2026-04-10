"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { loadJobs, editJob } from "../../../../store/slices/jobsSlice";
import JobForm from "../../../../components/jobs/JobForm";
import toast from "react-hot-toast";
import { Job } from "../../../../types";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const job = useAppSelector((s) => s.jobs.items.find((j) => j._id === id));
  const [loading, setLoading] = useState(false);

  useEffect(() => { dispatch(loadJobs()); }, [dispatch]);

  const handleSubmit = async (data: Omit<Job, "_id" | "createdAt">) => {
    setLoading(true);
    try {
      await dispatch(editJob({ id, data })).unwrap();
      toast.success("Job updated!");
      router.push("/jobs");
    } catch {
      toast.error("Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <JobForm initial={job} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
