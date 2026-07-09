"use client";

import { useSyncExternalStore } from "react";
import type { AnalyzedDrink, LogEntry } from "@/lib/types";
import { estimateStandardDrinks } from "@/lib/drinks";
import { pushDrinkToGroup } from "@/lib/group";

const KEY = "dt_drinks";
const EMPTY: LogEntry[] = [];

let cache: LogEntry[] = EMPTY;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): LogEntry[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as LogEntry[]) : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: LogEntry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cacheRaw = null; // force re-parse on next read
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

/** Reactive list of all logged drinks (newest first), backed by localStorage. */
export function useDrinks(): LogEntry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function addDrink(draft: AnalyzedDrink, createdAt?: string): LogEntry {
  const volume = Number(draft.volume_ml);
  const abv = Number(draft.abv_percent);
  const entry: LogEntry = {
    id: newId(),
    created_at: createdAt ?? new Date().toISOString(),
    name: draft.name.trim(),
    drink_type: draft.drink_type,
    volume_ml: volume,
    abv_percent: abv,
    calories: Number(draft.calories) || 0,
    standard_drinks: estimateStandardDrinks(volume, abv),
    notes: null,
  };
  // keep the list sorted newest-first even when backdating
  write([entry, ...read()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
  // share to the group if the user has joined one (best-effort)
  pushDrinkToGroup(entry).catch(() => {});
  return entry;
}

export function updateDrink(id: string, draft: AnalyzedDrink, createdAt?: string) {
  const volume = Number(draft.volume_ml);
  const abv = Number(draft.abv_percent);
  const next = read()
    .map((d) =>
      d.id === id
        ? {
            ...d,
            created_at: createdAt ?? d.created_at,
            name: draft.name.trim(),
            drink_type: draft.drink_type,
            volume_ml: volume,
            abv_percent: abv,
            calories: Number(draft.calories) || 0,
            standard_drinks: estimateStandardDrinks(volume, abv),
          }
        : d
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  write(next);
}

export function deleteDrink(id: string) {
  write(read().filter((d) => d.id !== id));
}
