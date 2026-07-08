"use client";

import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";

const KEY = "dt_theme";
const listeners = new Set<() => void>();

function current(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(KEY) as Theme) || "system";
}

/** Toggle the .dark class on <html> based on the chosen theme. */
export function applyTheme(t: Theme) {
  const dark =
    t === "dark" ||
    (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  applyTheme(t);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "system");
}

/** Inline script (runs before paint) that applies the saved theme to avoid a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&m)){document.documentElement.classList.add('dark');}}catch(e){}})();`;
