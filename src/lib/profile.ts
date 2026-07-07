"use client";

import { useSyncExternalStore } from "react";

export type Profile = {
  name: string;
  dailyGoalDrinks: number;
};

const KEY = "dt_profile";
const DEFAULT: Profile = { name: "", dailyGoalDrinks: 3 };

let cache: Profile = DEFAULT;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): Profile {
  if (typeof window === "undefined") return DEFAULT;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch {
      cache = DEFAULT;
    }
  }
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function saveProfile(next: Profile) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cacheRaw = null; // force re-parse on next read
  listeners.forEach((l) => l());
}

/** Reactive profile hook backed by localStorage (SSR-safe). */
export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

export function greetingFor(name: string) {
  const h = new Date().getHours();
  const timeGreeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${timeGreeting}, ${name}` : timeGreeting;
}
