import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Candidate } from "../../types";
import * as api from "../../lib/api";

interface CandidatesState {
  items: Candidate[];
  loading: boolean;
  error: string | null;
}

const initialState: CandidatesState = { items: [], loading: false, error: null };

export const loadCandidates = createAsyncThunk("candidates/load", api.fetchCandidates);
export const addCandidate = createAsyncThunk("candidates/add", api.createCandidate);
export const removeCandidate = createAsyncThunk("candidates/remove", async (id: string) => {
  await api.deleteCandidate(id);
  return id;
});
export const importCSV = createAsyncThunk("candidates/csv", ({ file, jobId }: { file: File; jobId?: string }) => api.uploadCSV(file, jobId));
export const importResumes = createAsyncThunk("candidates/resumes", ({ files, jobId }: { files: File[]; jobId?: string }) => api.uploadResumes(files, jobId));

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCandidates.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadCandidates.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(loadCandidates.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed to load candidates"; })
      .addCase(addCandidate.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(removeCandidate.fulfilled, (s, a) => { s.items = s.items.filter((c) => c._id !== a.payload); })
      .addCase(importCSV.fulfilled, (s, a) => { s.items.unshift(...a.payload.candidates); })
      .addCase(importResumes.fulfilled, (s, a) => { s.items.unshift(...a.payload.candidates); });
  },
});

export default candidatesSlice.reducer;
