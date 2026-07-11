"use client";

import { useSyncExternalStore } from "react";
import type { AnalyzedSession, SessionEntry } from "@/lib/types";

const KEY = "dt_sessions";
const EMPTY: SessionEntry[] = [];

let cache: SessionEntry[] = EMPTY;
let cacheRaw: string | null = null;
const listeners = new Set<() => void>();

function read(): SessionEntry[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as SessionEntry[]) : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: SessionEntry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cacheRaw = null;
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

export function useSessions(): SessionEntry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function addSession(draft: AnalyzedSession, createdAt?: string): SessionEntry {
  const entry: SessionEntry = {
    id: newId(),
    created_at: createdAt ?? new Date().toISOString(),
    name: draft.name.trim(),
    method: draft.method,
    amount: draft.amount.trim(),
    thc_percent: Number(draft.thc_percent) || 0,
    notes: draft.notes.trim(),
  };
  write([entry, ...read()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
  return entry;
}

export function updateSession(id: string, draft: AnalyzedSession, createdAt?: string) {
  const next = read()
    .map((s) =>
      s.id === id
        ? {
            ...s,
            created_at: createdAt ?? s.created_at,
            name: draft.name.trim(),
            method: draft.method,
            amount: draft.amount.trim(),
            thc_percent: Number(draft.thc_percent) || 0,
            notes: draft.notes.trim(),
          }
        : s
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  write(next);
}

export function deleteSession(id: string) {
  write(read().filter((s) => s.id !== id));
}
