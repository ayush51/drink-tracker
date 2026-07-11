"use client";

import { useSyncExternalStore } from "react";

export type Profile = {
  name: string;
  motto: string;
  dailyLimitDrinks: number;
  weeklyLimitDrinks: number;
  dryDaysGoal: number;
  costPerDrink: number;
  baselineWeeklyDrinks: number;
  weight: number;
  weightUnit: "kg" | "lb";
  sex: "" | "male" | "female";
  dailySessionLimit: number;
  onboarded: boolean;
};

const KEY = "dt_profile";
const DEFAULT: Profile = {
  name: "",
  motto: "",
  dailyLimitDrinks: 3,
  weeklyLimitDrinks: 0,
  dryDaysGoal: 0,
  costPerDrink: 0,
  baselineWeeklyDrinks: 0,
  weight: 0,
  weightUnit: "kg",
  sex: "",
  dailySessionLimit: 2,
  onboarded: false,
};

let cache: Profile = DEFAULT;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): Profile {
  if (typeof window === "undefined") return DEFAULT;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      cache = {
        name: parsed.name ?? DEFAULT.name,
        motto: parsed.motto ?? DEFAULT.motto,
        // migrate the old `dailyGoalDrinks` key if present
        dailyLimitDrinks:
          parsed.dailyLimitDrinks ?? parsed.dailyGoalDrinks ?? DEFAULT.dailyLimitDrinks,
        weeklyLimitDrinks: parsed.weeklyLimitDrinks ?? DEFAULT.weeklyLimitDrinks,
        dryDaysGoal: parsed.dryDaysGoal ?? DEFAULT.dryDaysGoal,
        costPerDrink: parsed.costPerDrink ?? DEFAULT.costPerDrink,
        baselineWeeklyDrinks: parsed.baselineWeeklyDrinks ?? DEFAULT.baselineWeeklyDrinks,
        weight: parsed.weight ?? DEFAULT.weight,
        weightUnit: parsed.weightUnit ?? DEFAULT.weightUnit,
        sex: parsed.sex ?? DEFAULT.sex,
        dailySessionLimit: parsed.dailySessionLimit ?? DEFAULT.dailySessionLimit,
        // existing users (already have a name) are treated as onboarded
        onboarded: parsed.onboarded ?? Boolean(parsed.name),
      };
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

export function saveProfile(next: Partial<Profile>) {
  const merged = { ...read(), ...next };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  cacheRaw = null; // force re-parse on next read
  listeners.forEach((l) => l());
}

/** Reactive profile hook backed by localStorage (SSR-safe). */
export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

/** True only after client hydration — lets us avoid SSR flashes without effects. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function greetingFor(name: string) {
  const h = new Date().getHours();
  const timeGreeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${timeGreeting}, ${name}` : timeGreeting;
}
