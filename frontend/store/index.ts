import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import jobsReducer, { resetJobs } from "./slices/jobsSlice";
import candidatesReducer, { resetCandidates } from "./slices/candidatesSlice";
import screeningReducer, { resetScreening } from "./slices/screeningSlice";
import authReducer from "./slices/authSlice";
import applicationsReducer, { resetApplications } from "./slices/applicationsSlice";
import toast from "react-hot-toast";
import { logout } from "./slices/authSlice";

const authPersistConfig = { key: "auth", storage, whitelist: ["user", "token"] };
const persistedAuth = persistReducer(authPersistConfig, authReducer);

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
  if (action.type === logout.type) {
    next(resetJobs());
    next(resetCandidates());
    next(resetScreening());
    next(resetApplications());
  }
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
    auth: persistedAuth,
    applications: applicationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }).concat(errorToastMiddleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
