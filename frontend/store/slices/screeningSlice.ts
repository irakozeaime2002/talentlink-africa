import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ScreeningResult } from "../../types";
import * as api from "../../lib/api";

interface ScreeningState {
  results: ScreeningResult[];
  active: ScreeningResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScreeningState = { results: [], active: null, loading: false, error: null };

export const triggerScreening = createAsyncThunk(
  "screening/run",
  ({ job_id, candidate_ids, top_n }: { job_id: string; candidate_ids: string[]; top_n?: number }) =>
    api.runScreening(job_id, candidate_ids, top_n)
);

export const loadScreeningResults = createAsyncThunk("screening/loadAll", (job_id: string) =>
  api.fetchScreeningResults(job_id)
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerScreening.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(triggerScreening.fulfilled, (s, a) => { s.loading = false; s.active = a.payload; s.results.unshift(a.payload); })
      .addCase(triggerScreening.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Screening failed"; })
      .addCase(loadScreeningResults.fulfilled, (s, a) => { s.results = a.payload; })
      .addCase(loadScreeningResult.fulfilled, (s, a) => { s.active = a.payload; })
      .addCase(removeScreeningResult.fulfilled, (s, a) => {
        s.results = s.results.filter((r) => r._id !== a.payload);
        if (s.active?._id === a.payload) s.active = null;
      });
  },
});

export const { clearActive, reset: resetScreening } = screeningSlice.actions;
export default screeningSlice.reducer;
