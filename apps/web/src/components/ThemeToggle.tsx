"use client";

import { useState, useEffect, useRef } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border-[0.5px] border-zinc-300 bg-surface text-zinc-500 transition-colors hover:text-midnight dark:bg-midnight dark:border-[#333355] dark:text-[#9999AA] dark:hover:text-[#F5F5F0]"
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M15.5 11.5A7 7 0 016.5 2.5a7 7 0 109 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
