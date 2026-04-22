import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ScreeningResult } from "../../types";
import * as api from "../../lib/api";

interface ScreeningState {
  results: ScreeningResult[];
  active: ScreeningResult | null;
  loading: boolean;
  error: string | null;
  lastFetched: Record<string, number>; // Cache per job ID
}

const initialState: ScreeningState = { results: [], active: null, loading: false, error: null, lastFetched: {} };

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const triggerScreening = createAsyncThunk(
  "screening/run",
  ({ job_id, candidate_ids, top_n }: { job_id: string; candidate_ids: string[]; top_n?: number }) =>
    api.runScreening(job_id, candidate_ids, top_n)
);

export const loadScreeningResults = createAsyncThunk(
  "screening/loadAll",
  async ({ job_id, forceRefresh = false }: { job_id: string; forceRefresh?: boolean }, { getState }) => {
    const state = getState() as { screening: ScreeningState };
    const now = Date.now();
    const lastFetch = state.screening.lastFetched[job_id];
    
    // Skip cache if forceRefresh is true or cache is stale
    if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION && state.screening.results.length > 0) {
      return { jobId: job_id, data: state.screening.results, fromCache: true };
    }
    
    // Add timestamp to prevent browser caching
    const data = await api.fetchScreeningResults(job_id);
    return { jobId: job_id, data, fromCache: false };
  }
);

export const loadScreeningResult = createAsyncThunk("screening/loadOne", (id: string) =>
  api.fetchScreeningResult(id)
);

export const removeScreeningResult = createAsyncThunk("screening/delete", (id: string) =>
  api.deleteScreeningResult(id).then(() => id)
);

const screeningSlice = createSlice({
  name: "screening",
  initialState,
  reducers: {
    clearActive: (s) => { s.active = null; },
    reset: () => initialState,
    invalidateCache: (s, a) => {
      // Invalidate cache for specific job or all jobs
      if (a.payload) {
        delete s.lastFetched[a.payload];
      } else {
        s.lastFetched = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerScreening.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(triggerScreening.fulfilled, (s, a) => { 
        s.loading = false; 
        s.active = a.payload;
        // Clear results so next loadScreeningResults always fetches fresh from DB
        s.results = [];
        s.lastFetched = {};
      })
      .addCase(triggerScreening.rejected, (s, a) => { 
        s.loading = false; 
        // Extract user-friendly error message
        const errorPayload = a.error.message || "Screening failed";
        
        // Check for specific error types and provide helpful messages
        if (errorPayload.includes('rate limit') || errorPayload.includes('429')) {
          s.error = "AI service is experiencing high demand. Please wait a moment and try again.";
        } else if (errorPayload.includes('connection') || errorPayload.includes('network') || errorPayload.includes('ECONNREFUSED')) {
          s.error = "Connection issue detected. Please check your internet connection and try again.";
        } else if (errorPayload.includes('timeout') || errorPayload.includes('ETIMEDOUT')) {
          s.error = "Request timed out. Please check your connection and try again.";
        } else if (errorPayload.includes('unavailable') || errorPayload.includes('All AI models failed')) {
          s.error = "AI screening service is temporarily unavailable. Please wait a moment and try again.";
        } else {
          s.error = errorPayload;
        }
      })
      .addCase(loadScreeningResults.fulfilled, (s, a) => { 
        s.results = a.payload.data;
        // Only update lastFetched if data is fresh (not from cache)
        if (!a.payload.fromCache) {
          s.lastFetched[a.payload.jobId] = Date.now();
        }
      })
      .addCase(loadScreeningResult.fulfilled, (s, a) => { s.active = a.payload; })
      .addCase(removeScreeningResult.fulfilled, (s, a) => {
        s.results = s.results.filter((r) => r._id !== a.payload);
        if (s.active?._id === a.payload) s.active = null;
        // Don't invalidate cache on delete - user might want to see remaining results
      });
  },
});

export const { clearActive, reset: resetScreening, invalidateCache } = screeningSlice.actions;
export default screeningSlice.reducer;
