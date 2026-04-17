import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Candidate } from "../../types";
import * as api from "../../lib/api";

interface CandidatesState {
  items: Candidate[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: CandidatesState = { items: [], loading: false, error: null, lastFetched: null };

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const loadCandidates = createAsyncThunk(
  "candidates/load",
  async (_, { getState }) => {
    const state = getState() as { candidates: CandidatesState };
    const now = Date.now();
    
    // Return cached data if it's fresh
    if (state.candidates.lastFetched && (now - state.candidates.lastFetched) < CACHE_DURATION && state.candidates.items.length > 0) {
      return state.candidates.items;
    }
    
    return api.fetchCandidates();
  }
);
export const addCandidate = createAsyncThunk("candidates/add", api.createCandidate);
export const removeCandidate = createAsyncThunk("candidates/remove", async (id: string) => {
  await api.deleteCandidate(id);
  return id;
});
export const bulkRemoveCandidates = createAsyncThunk("candidates/bulkRemove", async (ids: string[]) => {
  await api.bulkDeleteCandidates(ids);
  return ids;
});
export const importCSV = createAsyncThunk("candidates/csv", ({ file, jobId }: { file: File; jobId?: string }) => api.uploadCSV(file, jobId));
export const importResumes = createAsyncThunk("candidates/resumes", ({ files, jobId }: { files: File[]; jobId?: string }) => api.uploadResumes(files, jobId));

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCandidates.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadCandidates.fulfilled, (s, a) => { 
        s.loading = false; 
        s.items = a.payload; 
        s.lastFetched = Date.now();
      })
      .addCase(loadCandidates.rejected, (s, a) => { 
        s.loading = false; 
        const errorMsg = a.error.message || "Failed to load candidates";
        if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ERR_CONNECTION')) {
          s.error = "Connection error. Please check your internet connection and try again.";
        } else if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
          s.error = "Request timed out. Please check your connection and try again.";
        } else {
          s.error = errorMsg;
        }
      })
      .addCase(addCandidate.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(removeCandidate.fulfilled, (s, a) => { s.items = s.items.filter((c) => c._id !== a.payload); })
      .addCase(bulkRemoveCandidates.fulfilled, (s, a) => { s.items = s.items.filter((c) => !a.payload.includes(c._id)); })
      .addCase(importCSV.fulfilled, (s, a) => { s.items.unshift(...a.payload.candidates); })
      .addCase(importResumes.fulfilled, (s, a) => { s.items.unshift(...a.payload.candidates); });
  },
});

export const { reset: resetCandidates } = candidatesSlice.actions;
export default candidatesSlice.reducer;
