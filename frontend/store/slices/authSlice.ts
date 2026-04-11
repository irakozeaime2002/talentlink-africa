import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { User } from "../../types";
import * as api from "../../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? Cookies.get("token") || null : null,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: { name: string; email: string; password: string; role: string }) => {
    const res = await api.register(data);
    Cookies.set("token", res.token, { expires: 7 });
    return res;
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }) => {
    const res = await api.login(data);
    Cookies.set("token", res.token, { expires: 7 });
    return res;
  }
);

export const loadMe = createAsyncThunk("auth/me", api.getMe);
export const updateProfile = createAsyncThunk(
  "auth/updateMe",
  (data: Partial<User>) => api.updateMe(data)
);
export const upgradePlan = createAsyncThunk(
  "auth/upgradePlan",
  ({ plan, billing }: { plan: string; billing: "monthly" | "yearly" }) => {
    return api.upgradePlan(plan, billing).then((res) => {
      Cookies.set("token", res.token, { expires: 7 });
      return res;
    });
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      Cookies.remove("token");
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.error.message || "Failed"; })
      .addCase(loadMe.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(upgradePlan.fulfilled, (s, a) => { s.user = a.payload.user; s.token = a.payload.token; });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
