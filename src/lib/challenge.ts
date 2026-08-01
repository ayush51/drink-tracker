"use client";

import { useSyncExternalStore } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { joinGroup, deviceId, DEFAULT_GROUP, useGroup } from "@/lib/group";
import { todayLocal } from "@/lib/drinks";
import type { LogEntry } from "@/lib/types";

export const CHALLENGE_ID = "abstain_august";
export const CHALLENGE_NAME = "Abstain August";

const MEMBERSHIP_KEY = "dt_abstain_membership";
const listeners = new Set<() => void>();

export type ChallengeMembership = { joined: true; joinedAt: string; name: string };

let cache: ChallengeMembership | null = null;
let cacheRaw: string | null = null;

function read(): ChallengeMembership | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBERSHIP_KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as ChallengeMembership) : null;
    } catch {
      cache = null;
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

function notify() {
  cacheRaw = null;
  listeners.forEach((l) => l());
}

export function useChallengeMembership(): ChallengeMembership | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export { useGroup };
export const challengeSocialEnabled = isSupabaseConfigured;

/** August 1 00:00 through Aug 31 23:59:59.999, for the given (or current) year. */
export function augustRange(year: number = new Date().getFullYear()): { start: Date; end: Date } {
  return { start: new Date(year, 7, 1, 0, 0, 0, 0), end: new Date(year, 7, 31, 23, 59, 59, 999) };
}

export type Phase = "upcoming" | "active" | "ended";

export function challengePhase(now: Date = new Date()): Phase {
  const { start, end } = augustRange(now.getFullYear());
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

export function daysUntilAugust(now: Date = new Date()): number {
  const { start } = augustRange(now.getFullYear());
  return Math.max(0, Math.ceil((+start - +now) / 86400000));
}

/** How many August days have happened so far (1..31), for the active/ended phase. */
export function daysElapsedInAugust(now: Date = new Date()): number {
  const phase = challengePhase(now);
  if (phase === "upcoming") return 0;
  if (phase === "ended") return 31;
  return now.getDate();
}

export type LocalProgress = {
  daysElapsed: number;
  dryDays: number;
  brokenOn: string | null; // YYYY-MM-DD of the first drink day, if any
};

/** Progress computed purely from this device's own drink log — works even if not joined/synced. */
export function localAugustProgress(drinks: LogEntry[], now: Date = new Date()): LocalProgress {
  const daysElapsed = daysElapsedInAugust(now);
  const year = now.getFullYear();
  const wetDays = new Set<string>();
  for (const d of drinks) {
    const dt = new Date(d.created_at);
    if (dt.getFullYear() === year && dt.getMonth() === 7) {
      wetDays.add(todayLocal(dt));
    }
  }
  let brokenOn: string | null = null;
  for (let day = 1; day <= daysElapsed; day++) {
    const key = `${year}-08-${String(day).padStart(2, "0")}`;
    if (wetDays.has(key)) {
      brokenOn = key;
      break;
    }
  }
  const dryDays = brokenOn ? Number(brokenOn.slice(-2)) - 1 : daysElapsed;
  return { daysElapsed, dryDays, brokenOn };
}

/** Have they earned the Abstain August badge: joined, month over, zero alcoholic days logged. */
export function abstainAugustBadgeEarned(
  membership: ChallengeMembership | null,
  drinks: LogEntry[],
  now: Date = new Date()
): boolean {
  if (!membership) return false;
  if (challengePhase(now) !== "ended") return false;
  return localAugustProgress(drinks, now).brokenOn === null;
}

/** Join the challenge: ensures social group membership, records challenge_members, saves locally. */
export async function joinChallenge(name: string): Promise<{ ok: boolean; error?: string }> {
  const n = name.trim();
  if (!n) return { ok: false, error: "Enter your name first." };
  if (!supabase) return { ok: false, error: "Social features aren't configured." };

  const existingGroup = (() => {
    try {
      return JSON.parse(localStorage.getItem("dt_group") || "null");
    } catch {
      return null;
    }
  })();
  if (!existingGroup) {
    const res = await joinGroup(n, DEFAULT_GROUP);
    if (!res.ok) return res;
  }

  const did = deviceId();
  const { error } = await supabase
    .from("challenge_members")
    .upsert({ challenge: CHALLENGE_ID, device_id: did, name: n }, { onConflict: "challenge,device_id" });
  if (error) return { ok: false, error: error.message };

  localStorage.setItem(
    MEMBERSHIP_KEY,
    JSON.stringify({ joined: true, joinedAt: new Date().toISOString(), name: n })
  );
  notify();
  return { ok: true };
}

export function leaveChallengeLocally() {
  localStorage.removeItem(MEMBERSHIP_KEY);
  notify();
}

export type CrewRow = {
  deviceId: string;
  name: string;
  dryDays: number;
  daysElapsed: number;
  brokenOn: string | null;
};

/** Crew progress: challenge members cross-referenced with their synced drinks this August. */
export async function fetchChallengeCrew(now: Date = new Date()): Promise<CrewRow[]> {
  if (!supabase) return [];
  const { start, end } = augustRange(now.getFullYear());
  const daysElapsed = daysElapsedInAugust(now);

  const [membersRes, drinksRes] = await Promise.all([
    supabase.from("challenge_members").select("device_id,name").eq("challenge", CHALLENGE_ID),
    supabase
      .from("group_drinks")
      .select("device_id,created_at,standard_drinks")
      .eq("group_code", DEFAULT_GROUP)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
  ]);

  const members = membersRes.data ?? [];
  const drinks = (drinksRes.data ?? []) as { device_id: string; created_at: string; standard_drinks: number }[];

  const wetDaysByDevice = new Map<string, Set<string>>();
  for (const d of drinks) {
    if (d.standard_drinks <= 0) continue;
    const set = wetDaysByDevice.get(d.device_id) ?? new Set<string>();
    set.add(todayLocal(new Date(d.created_at)));
    wetDaysByDevice.set(d.device_id, set);
  }

  return members
    .map((m): CrewRow => {
      const wet = wetDaysByDevice.get(m.device_id) ?? new Set<string>();
      let brokenOn: string | null = null;
      for (let day = 1; day <= daysElapsed; day++) {
        const key = `${now.getFullYear()}-08-${String(day).padStart(2, "0")}`;
        if (wet.has(key)) {
          brokenOn = key;
          break;
        }
      }
      const dryDays = brokenOn ? Number(brokenOn.slice(-2)) - 1 : daysElapsed;
      return { deviceId: m.device_id, name: m.name, dryDays, daysElapsed, brokenOn };
    })
    .sort((a, b) => b.dryDays - a.dryDays);
}
