"use client";
import "./globals.css";
import { store } from "../store";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import Navbar from "../components/ui/Navbar";
import AuthLoader from "../components/ui/AuthLoader";
import AIChatWidget from "../components/ui/ThemeControls";
import Footer from "../components/ui/Footer";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="noise-bg">
        {/* Ambient orbs */}
        <div className="orb w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 top-[-100px] left-[-100px]" />
        <div className="orb w-80 h-80 bg-violet-300/20 dark:bg-violet-600/10 bottom-[-80px] right-[-80px]" style={{ animationDelay: "3s" }} />
        <div className="orb w-64 h-64 bg-blue-300/15 dark:bg-blue-600/10 top-1/2 right-1/4" style={{ animationDelay: "1.5s" }} />

        <ThemeProvider>
          <Provider store={store}>
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
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
