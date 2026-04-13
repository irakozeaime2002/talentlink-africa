import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Application } from "../../types";
import * as api from "../../lib/api";

interface ApplicationsState {
  items: Application[];
  loading: boolean;
}

const initialState: ApplicationsState = { items: [], loading: false };

export const loadJobApplications = createAsyncThunk("applications/byJob", api.fetchJobApplications);
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
      .addCase(loadJobApplications.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(loadMyApplications.pending, (s) => { s.loading = true; })
      .addCase(loadMyApplications.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(changeApplicationStatus.fulfilled, (s, a) => {
        const i = s.items.findIndex((x) => x._id === a.payload._id);
        if (i !== -1) s.items[i] = a.payload;
      });
  },
});

export const { reset: resetApplications } = applicationsSlice.actions;
export default applicationsSlice.reducer;
