"use client";
import { store, persistor } from "../store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import Navbar from "./ui/Navbar";
import AuthLoader from "./ui/AuthLoader";
import AIChatWidget from "./ui/ThemeControls";
import Footer from "./ui/Footer";
import { ThemeProvider } from "../context/ThemeContext";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={<>{children}</>} persistor={persistor}>
          <AuthLoader />
          <Navbar />
          <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">{children}</main>
          <Footer />
          <AIChatWidget />
          <Toaster
            position="top-right"
            toastOptions={{
              className: "glass-card !text-sm",
              duration: 3500,
            }}
          />
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}
