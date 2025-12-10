"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Načítaj uloženú tému alebo použij systémovú preferenciu
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return null; // Aby sa predišlo hydration mismatch
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative h-8 w-14 rounded-full bg-slate-700 border border-slate-600 transition-colors hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      aria-label={`Prepnúť na ${theme === "dark" ? "svetlú" : "tmavú"} tému`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transform transition-transform ${
          theme === "dark" ? "translate-x-0" : "translate-x-6"
        }`}
      >
        <span className="absolute inset-0 flex items-center justify-center text-xs">
          {theme === "dark" ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}

