import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "./slices/jobsSlice";
import candidatesReducer from "./slices/candidatesSlice";
import screeningReducer from "./slices/screeningSlice";
import authReducer from "./slices/authSlice";
import applicationsReducer from "./slices/applicationsSlice";
import toast from "react-hot-toast";

// Thunks that fail silently (handled by the component or not user-facing)
const silencedThunks = [
  "auth/me",
  "applications/byJob",
  "applications/mine",
  "screening/loadAll",
  "screening/loadOne",
  "candidates/load",
  "jobs/load",
];

const errorToastMiddleware = (_store: any) => (next: any) => (action: any) => {
  const result = next(action);
  if (action.type?.endsWith("/rejected") && action.error?.message) {
    const isSilenced = silencedThunks.some((s) => action.type.startsWith(s));
    if (!isSilenced) toast.error(action.error.message);
  }
  return result;
};

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    candidates: candidatesReducer,
    screening: screeningReducer,
    auth: authReducer,
    applications: applicationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(errorToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
