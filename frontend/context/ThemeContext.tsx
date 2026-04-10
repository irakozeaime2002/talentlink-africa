"use client";
import { createContext, useContext, useEffect, useState } from "react";

type AccentColor = "default" | "indigo" | "violet" | "blue" | "emerald" | "rose";

interface ThemeContextType {
  dark: boolean;
  toggleDark: () => void;
  accent: AccentColor;
  setAccent: (c: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggleDark: () => {},
  accent: "default",
  setAccent: () => {},
});

export const ACCENT_COLORS: Record<AccentColor, { primary: string; light: string; dark: string; text: string; label: string }> = {
  default: { primary: "#64748b", light: "#f8fafc", dark: "#0f172a", text: "text-slate-600", label: "Default" },
  indigo:  { primary: "#6C63FF", light: "#eef2ff", dark: "#1e1b4b", text: "text-indigo-600", label: "Indigo" },
  violet:  { primary: "#8B5CF6", light: "#f5f3ff", dark: "#1d1040", text: "text-violet-600", label: "Violet" },
  blue:    { primary: "#3B82F6", light: "#eff6ff", dark: "#0f1e3d", text: "text-blue-600",   label: "Blue" },
  emerald: { primary: "#10B981", light: "#ecfdf5", dark: "#052e1c", text: "text-emerald-600", label: "Green" },
  rose:    { primary: "#F43F5E", light: "#fff1f2", dark: "#2d0a12", text: "text-rose-600",   label: "Rose" },
};

const applyAccent = (color: AccentColor, isDark: boolean) => {
  const { primary, light, dark } = ACCENT_COLORS[color];
  const root = document.documentElement;
  root.style.setProperty("--accent", primary);
  root.style.setProperty("--accent-light", isDark ? dark : light);

  if (color === "default") {
    // Plain clean background — no tint
    root.style.setProperty("--bg-gradient", isDark
      ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
    );
  } else {
    root.style.setProperty("--bg-gradient", isDark
      ? `linear-gradient(135deg, #0a0a14 0%, ${dark} 50%, #0d0d1a 100%)`
      : `linear-gradient(135deg, #f8fafc 0%, ${light} 50%, #faf5ff 100%)`
    );
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [accent, setAccentState] = useState<AccentColor>("default");

  useEffect(() => {
    const savedDark = localStorage.getItem("theme") === "dark";
    const savedAccent = (localStorage.getItem("accent") as AccentColor) || "default";
    setDark(savedDark);
    setAccentState(savedAccent);
    if (savedDark) document.documentElement.classList.add("dark");
    applyAccent(savedAccent, savedDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    applyAccent(accent, next);
  };

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem("accent", color);
    applyAccent(color, dark);
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
