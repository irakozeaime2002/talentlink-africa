import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Application } from "../../types";
import * as api from "../../lib/api";

interface ApplicationsState {
  items: Application[];
  loading: boolean;
  lastFetched: Record<string, number>; // Cache per job ID
}

const initialState: ApplicationsState = { items: [], loading: false, lastFetched: {} };

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

export const loadJobApplications = createAsyncThunk(
  "applications/byJob",
  async ({ jobId, page = 1, limit = 50 }: { jobId: string; page?: number; limit?: number }, { getState }) => {
    const state = getState() as { applications: ApplicationsState };
    const now = Date.now();
    const lastFetch = state.applications.lastFetched[jobId];
    
    // Return cached data if it's fresh and first page
    if (page === 1 && lastFetch && (now - lastFetch) < CACHE_DURATION && state.applications.items.length > 0) {
      return { jobId, data: state.applications.items, fromCache: true };
    }
    
    const response = await api.fetchJobApplications(jobId, page, limit);
    return { jobId, data: response.applications, fromCache: false };
  }
);
export const loadMyApplications = createAsyncThunk("applications/mine", api.fetchMyApplications);
export const changeApplicationStatus = createAsyncThunk(
  "applications/status",
  ({ id, status }: { id: string; status: string }) => api.updateApplicationStatus(id, status)
);

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobApplications.pending, (s) => { s.loading = true; })
      .addCase(loadJobApplications.fulfilled, (s, a) => { 
        s.loading = false; 
        s.items = a.payload.data; 
        if (!a.payload.fromCache) {
          s.lastFetched[a.payload.jobId] = Date.now();
        }
      })
      .addCase(loadJobApplications.rejected, (s, a) => { 
        s.loading = false;
      })
      .addCase(loadMyApplications.pending, (s) => { s.loading = true; })
      .addCase(loadMyApplications.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(loadMyApplications.rejected, (s) => { 
        s.loading = false;
      })
      .addCase(changeApplicationStatus.fulfilled, (s, a) => {
        const i = s.items.findIndex((x) => x._id === a.payload._id);
        if (i !== -1) s.items[i] = a.payload;
      });
  },
});

export const { reset: resetApplications } = applicationsSlice.actions;
export default applicationsSlice.reducer;
