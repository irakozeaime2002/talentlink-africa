import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Job } from "../../types";
import * as api from "../../lib/api";

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: JobsState = { items: [], loading: false, error: null, lastFetched: null };

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const loadJobs = createAsyncThunk(
  "jobs/load",
  async (_, { getState }) => {
    const state = getState() as { jobs: JobsState };
    const now = Date.now();
    
    // Return cached data if it's fresh
    if (state.jobs.lastFetched && (now - state.jobs.lastFetched) < CACHE_DURATION && state.jobs.items.length > 0) {
      return state.jobs.items;
    }
    
    return api.fetchJobs();
  }
);
export const addJob = createAsyncThunk("jobs/add", api.createJob);
export const editJob = createAsyncThunk("jobs/edit", ({ id, data }: { id: string; data: Partial<Job> }) =>
  api.updateJob(id, data)
);
export const removeJob = createAsyncThunk("jobs/remove", async (id: string) => {
  await api.deleteJob(id);
  return id;
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadJobs.fulfilled, (s, a) => { 
        s.loading = false; 
        s.items = a.payload; 
        s.lastFetched = Date.now();
      })
      .addCase(loadJobs.rejected, (s, a) => { 
        s.loading = false; 
        const errorMsg = a.error.message || "Failed to load jobs";
        if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ERR_CONNECTION')) {
          s.error = "Connection error. Please check your internet connection and try again.";
        } else if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
          s.error = "Request timed out. Please check your connection and try again.";
        } else {
          s.error = errorMsg;
        }
      })
      .addCase(addJob.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(editJob.fulfilled, (s, a) => {
        const i = s.items.findIndex((j) => j._id === a.payload._id);
        if (i !== -1) s.items[i] = a.payload;
      })
      .addCase(removeJob.fulfilled, (s, a) => { s.items = s.items.filter((j) => j._id !== a.payload); });
  },
});

export const { reset: resetJobs } = jobsSlice.actions;
export default jobsSlice.reducer;
