"use client";

import { useSyncExternalStore } from "react";

export type AppMode = "alcohol" | "weed";

const KEY = "dt_mode";
const listeners = new Set<() => void>();

function read(): AppMode {
  if (typeof window === "undefined") return "alcohol";
  return localStorage.getItem(KEY) === "weed" ? "weed" : "alcohol";
}

export function applyMode(mode: AppMode) {
  document.documentElement.classList.toggle("weed", mode === "weed");
}

export function setMode(mode: AppMode) {
  localStorage.setItem(KEY, mode);
  applyMode(mode);
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

export function useMode(): AppMode {
  return useSyncExternalStore(subscribe, read, () => "alcohol");
}

/** Inline script (runs before paint) so the reskin never flashes. */
export const modeInitScript = `(function(){try{if(localStorage.getItem('${KEY}')==='weed'){document.documentElement.classList.add('weed');}}catch(e){}})();`;
