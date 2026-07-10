"use client";

import { useSyncExternalStore } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LogEntry } from "@/lib/types";

export type Membership = { code: string; name: string; deviceId: string };

const KEY = "dt_group";
const DEVICE_KEY = "dt_device_id";
const listeners = new Set<() => void>();

export const socialEnabled = isSupabaseConfigured;

/** Everyone shares one community group — no codes. */
export const DEFAULT_GROUP = "EVERYONE";

function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

let cache: Membership | null = null;
let cacheRaw: string | null = null;

function read(): Membership | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as Membership) : null;
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

export function useGroup(): Membership | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function joinGroup(
  name: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Social features aren't configured." };
  const c = code.trim().toUpperCase();
  const n = name.trim();
  if (!c || !n) return { ok: false, error: "Enter both a name and a code." };
  const did = deviceId();
  const { error } = await supabase
    .from("members")
    .upsert({ group_code: c, device_id: did, name: n }, { onConflict: "group_code,device_id" });
  if (error) return { ok: false, error: error.message };
  localStorage.setItem(KEY, JSON.stringify({ code: c, name: n, deviceId: did }));
  notify();
  return { ok: true };
}

export function leaveGroup() {
  localStorage.removeItem(KEY);
  notify();
}

const SYNCED_KEY = "dt_synced_drinks";

function syncedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY) || "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markSynced(ids: string[]) {
  const s = syncedSet();
  ids.forEach((id) => s.add(id));
  localStorage.setItem(SYNCED_KEY, JSON.stringify([...s]));
}

function rowFor(m: Membership, entry: LogEntry) {
  return {
    group_code: m.code,
    device_id: m.deviceId,
    name: m.name,
    drink_name: entry.name,
    drink_type: entry.drink_type,
    standard_drinks: entry.standard_drinks,
    calories: entry.calories,
    created_at: entry.created_at,
  };
}

/** Fire-and-forget: share a locally logged drink to the current group. */
export async function pushDrinkToGroup(entry: LogEntry) {
  const m = read();
  if (!supabase || !m || syncedSet().has(entry.id)) return;
  const { error } = await supabase.from("group_drinks").insert(rowFor(m, entry));
  if (!error) markSynced([entry.id]);
}

/** Push already-logged drinks (e.g. this week's) to the group, skipping any already synced. */
export async function backfillDrinks(drinks: LogEntry[]) {
  const m = read();
  if (!supabase || !m || drinks.length === 0) return;
  const synced = syncedSet();
  const todo = drinks.filter((d) => !synced.has(d.id));
  if (todo.length === 0) return;
  const { error } = await supabase.from("group_drinks").insert(todo.map((d) => rowFor(m, d)));
  if (!error) markSynced(todo.map((d) => d.id));
}

export type GroupDrink = {
  id: string;
  device_id: string;
  name: string;
  drink_name: string;
  drink_type: string;
  standard_drinks: number;
  calories: number;
  created_at: string;
};
export type Member = { device_id: string; name: string };
export type Reaction = { id: string; drink_id: string; device_id: string; emoji: string };

export async function fetchGroupData(
  code: string
): Promise<{ members: Member[]; drinks: GroupDrink[]; reactions: Reaction[] }> {
  if (!supabase) return { members: [], drinks: [], reactions: [] };
  const [mRes, dRes, rRes] = await Promise.all([
    supabase.from("members").select("device_id,name").eq("group_code", code),
    supabase
      .from("group_drinks")
      .select("*")
      .eq("group_code", code)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("reactions").select("id,drink_id,device_id,emoji").eq("group_code", code),
  ]);
  return {
    members: mRes.data ?? [],
    drinks: (dRes.data as GroupDrink[]) ?? [],
    reactions: (rRes.data as Reaction[]) ?? [],
  };
}

/** Live updates: fire `onChange` whenever the group's drinks, members, or reactions change. */
export function subscribeToGroup(code: string, onChange: () => void): () => void {
  if (!supabase) return () => {};
  const filter = `group_code=eq.${code}`;
  const channel = supabase
    .channel(`group-${code}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_drinks", filter }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "members", filter }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "reactions", filter }, onChange)
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}

export async function toggleReaction(drinkId: string, emoji: string, hasReacted: boolean) {
  const m = read();
  if (!supabase || !m) return;
  if (hasReacted) {
    await supabase
      .from("reactions")
      .delete()
      .match({ drink_id: drinkId, device_id: m.deviceId, emoji });
  } else {
    await supabase
      .from("reactions")
      .insert({ drink_id: drinkId, group_code: m.code, device_id: m.deviceId, emoji });
  }
}
