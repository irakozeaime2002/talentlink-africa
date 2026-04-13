import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { Job, Candidate, ScreeningResult, User, Application } from "../types";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string }>) => {
    if (!err.response) {
      return Promise.reject(new Error("Cannot connect to server. Please check your internet connection or try again later."));
    }
    const status = err.response.status;
    const serverMsg = err.response.data?.error;
    const messages: Record<number, string> = {
      400: serverMsg || "Invalid request. Please check your input.",
      401: "You are not logged in. Please sign in to continue.",
      403: serverMsg || "You do not have permission to perform this action.",
      404: serverMsg || "The requested resource was not found.",
      409: serverMsg || "A conflict occurred. This record may already exist.",
      429: "Too many requests. Please wait a moment and try again.",
      500: "Server error. Please try again in a few seconds.",
      503: "Service temporarily unavailable. Please try again later.",
    };
    const message = messages[status] || serverMsg || `Unexpected error (${status}). Please try again.`;
    return Promise.reject(new Error(message));
  }
);

// Auth
export const register = (data: { name: string; email: string; password: string; role: string }) =>
  api.post<{ token: string; user: User }>("/auth/register", data).then((r) => r.data);
export const login = (data: { email: string; password: string }) =>
  api.post<{ token: string; user: User }>("/auth/login", data).then((r) => r.data);
export const getMe = () => api.get<User>("/auth/me").then((r) => r.data);
export const updateMe = (data: Partial<User>) => api.put<User>("/auth/me", data).then((r) => r.data);
export const forgotPassword = (email: string) => api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const resetPassword = (token: string, password: string) => api.post("/auth/reset-password", { token, password }).then((r) => r.data);
export const upgradePlan = (plan: string, billing: string) =>
  api.post<{ user: User; token: string }>("/auth/upgrade-plan", { plan, billing }).then((r) => r.data);

// Jobs (recruiter)
export const fetchJobs = () => api.get<Job[]>("/jobs").then((r) => r.data);
export const fetchJob = (id: string) => api.get<Job>(`/jobs/${id}`).then((r) => r.data);
export const createJob = (data: Omit<Job, "_id" | "createdAt">) => api.post<Job>("/jobs", data).then((r) => r.data);
export const updateJob = (id: string, data: Partial<Job>) => api.put<Job>(`/jobs/${id}`, data).then((r) => r.data);
export const deleteJob = (id: string) => api.delete(`/jobs/${id}`).then((r) => r.data);

// Jobs (public board)
export const fetchPublicJobs = () => api.get<Job[]>("/jobs/public").then((r) => r.data);
export const fetchPublicJob = (id: string) => api.get<Job>(`/jobs/public/${id}`).then((r) => r.data);

// Candidates
export const fetchCandidates = () => api.get<Candidate[]>("/candidates").then((r) => r.data);
export const createCandidate = (data: Omit<Candidate, "_id">) => api.post<Candidate>("/candidates", data).then((r) => r.data);
export const deleteCandidate = (id: string) => api.delete(`/candidates/${id}`).then((r) => r.data);
export const bulkDeleteCandidates = (ids: string[]) => api.post("/candidates/bulk-delete", { ids }).then((r) => r.data);

export const uploadCSV = (file: File, jobId?: string) => {
  const form = new FormData();
  form.append("file", file);
  if (jobId) form.append("job_id", jobId);
  return api.post<{ inserted: number; candidates: Candidate[] }>("/candidates/upload/csv", form).then((r) => r.data);
};

export const uploadResumes = (files: File[], jobId?: string) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (jobId) form.append("job_id", jobId);
  return api.post<{ inserted: number; candidates: Candidate[] }>("/candidates/upload/resumes", form).then((r) => r.data);
};

// Screening
export const runScreening = (job_id: string, candidate_ids: string[], top_n = 20) =>
  api.post<ScreeningResult>("/screening", { job_id, candidate_ids, top_n }).then((r) => r.data);
export const fetchScreeningResults = (job_id: string) =>
  api.get<ScreeningResult[]>(`/screening/job/${job_id}`).then((r) => r.data);
export const fetchScreeningResult = (id: string) =>
  api.get<ScreeningResult>(`/screening/${id}`).then((r) => r.data);
export const deleteScreeningResult = (id: string) =>
  api.delete(`/screening/${id}`).then((r) => r.data);

// Seed & Stats
export const seedCandidates = () => api.post("/seed/candidates").then((r) => r.data);
export const fetchStats = () => api.get<{ totalJobs: number; openJobs: number; totalCandidates: number; profileCandidates: number }>("/seed/stats").then((r) => r.data);

// Applications
export const fetchMyJobsCandidates = () =>
  api.get<Candidate[]>("/applications/my-jobs-candidates").then((r) => r.data);
export const fetchMyProfile = () =>
  api.get<Candidate | null>("/applications/my-profile").then((r) => r.data);
export const updateMyProfile = (data: Partial<Candidate>) =>
  api.put<Candidate>("/applications/my-profile", data).then((r) => r.data);
export const uploadMyCV = (file: File) => {
  const form = new FormData();
  form.append("cv", file);
  return api.post<{ cv_filename: string }>("/applications/my-cv", form).then((r) => r.data);
};
export const applyToJob = (job_id: string, data: Partial<Application> | FormData) =>
  api.post<Application>(`/applications/job/${job_id}`, data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  }).then((r) => r.data);
export const fetchJobApplicantCandidates = (job_id: string) =>
  api.get<Candidate[]>(`/applications/job/${job_id}/candidates`).then((r) => r.data);
export const fetchJobApplications = (job_id: string) =>
  api.get<Application[]>(`/applications/job/${job_id}`).then((r) => r.data);
export const fetchMyApplications = () =>
  api.get<Application[]>("/applications/my").then((r) => r.data);
export const updateMyApplication = (id: string, data: { cover_letter?: string; answers?: { question: string; answer: string }[] } | FormData) =>
  api.patch<Application>(`/applications/${id}`, data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  }).then((r) => r.data);
export const updateApplicationStatus = (id: string, status: string) =>
  api.patch<Application>(`/applications/${id}/status`, { status }).then((r) => r.data);
export const fetchApplicantProfile = (applicant_id: string) =>
  api.get<Candidate | null>(`/applications/applicant/${applicant_id}/profile`).then((r) => r.data);
export const fetchApplicantUser = (applicant_id: string) =>
  api.get<User>(`/applications/applicant/${applicant_id}/user`).then((r) => r.data);
export const deleteMyApplication = (id: string) =>
  api.delete(`/applications/${id}`).then((r) => r.data);

// Advertisements
export const fetchPublicAds = () => api.get("/public/ads").then((r) => r.data);
export const adminGetAds = () => api.get("/ads").then((r) => r.data);
export const adminCreateAd = (data: any) => api.post("/ads", data).then((r) => r.data);
export const adminUpdateAd = (id: string, data: any) => api.put(`/ads/${id}`, data).then((r) => r.data);
export const adminDeleteAd = (id: string) => api.delete(`/ads/${id}`).then((r) => r.data);

// Chat
export const sendChatMessage = (message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) =>
  api.post<{ reply: string }>("/chat", { message, history }).then((r) => r.data);

// Admin
export const adminGetStats = () => api.get("/admin/stats").then((r) => r.data);
export const adminGetUsers = (params?: Record<string, any>) => api.get("/admin/users", { params }).then((r) => r.data);
export const adminUpdateUser = (id: string, data: any) => api.put(`/admin/users/${id}`, data).then((r) => r.data);
export const adminDeleteUser = (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data);
export const adminResetPassword = (id: string, password: string) => api.post(`/admin/users/${id}/reset-password`, { password }).then((r) => r.data);
export const adminGetJobs = (params?: Record<string, any>) => api.get("/admin/jobs", { params }).then((r) => r.data);
export const adminDeleteJob = (id: string) => api.delete(`/admin/jobs/${id}`).then((r) => r.data);
export const adminUpdateJobStatus = (id: string, status: string) => api.patch(`/admin/jobs/${id}/status`, { status }).then((r) => r.data);
export const adminGetApplications = (params?: Record<string, any>) => api.get("/admin/applications", { params }).then((r) => r.data);
export const adminGetScreenings = () => api.get("/admin/screenings").then((r) => r.data);
export const adminCreateAdmin = (data: { name: string; email: string; password: string }) => api.post("/admin/create-admin", data).then((r) => r.data);
export const adminGetSubscriptions = (params?: Record<string, any>) => api.get("/admin/subscriptions", { params }).then((r) => r.data);
export const adminUpdateUserPlan = (id: string, plan: string, planExpiresAt?: string) => api.patch(`/admin/subscriptions/${id}/plan`, { plan, planExpiresAt }).then((r) => r.data);
export const adminGetPlanConfigs = () => api.get("/admin/plan-configs").then((r) => r.data);
export const adminUpdatePlanConfig = (plan: string, data: any) => api.put(`/admin/plan-configs/${plan}`, data).then((r) => r.data);
export const adminGetApplicantPlanConfigs = () => api.get("/admin/applicant-plan-configs").then((r) => r.data);
export const adminUpdateApplicantPlanConfig = (plan: string, data: any) => api.put(`/admin/applicant-plan-configs/${plan}`, data).then((r) => r.data);
export const fetchPublicPlanConfigs = () => api.get("/public/plan-configs").then((r) => r.data);
export const fetchPublicApplicantPlanConfigs = () => api.get("/public/applicant-plan-configs").then((r) => r.data);
