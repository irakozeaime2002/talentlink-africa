import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Job } from "../../types";
import * as api from "../../lib/api";

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = { items: [], loading: false, error: null };

export const loadJobs = createAsyncThunk("jobs/load", api.fetchJobs);
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
      .addCase(loadJobs.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(loadJobs.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed to load jobs"; })
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
