"use client";

import { useSyncExternalStore } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LogEntry } from "@/lib/types";

export type Membership = { code: string; name: string; deviceId: string };

const KEY = "dt_group";
const DEVICE_KEY = "dt_device_id";
const listeners = new Set<() => void>();

export const socialEnabled = isSupabaseConfigured;

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

/** Fire-and-forget: share a locally logged drink to the current group. */
export async function pushDrinkToGroup(entry: LogEntry) {
  const m = read();
  if (!supabase || !m) return;
  await supabase.from("group_drinks").insert({
    group_code: m.code,
    device_id: m.deviceId,
    name: m.name,
    drink_name: entry.name,
    drink_type: entry.drink_type,
    standard_drinks: entry.standard_drinks,
    calories: entry.calories,
    created_at: entry.created_at,
  });
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

export async function fetchGroupData(
  code: string
): Promise<{ members: Member[]; drinks: GroupDrink[] }> {
  if (!supabase) return { members: [], drinks: [] };
  const [mRes, dRes] = await Promise.all([
    supabase.from("members").select("device_id,name").eq("group_code", code),
    supabase
      .from("group_drinks")
      .select("*")
      .eq("group_code", code)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  return { members: mRes.data ?? [], drinks: (dRes.data as GroupDrink[]) ?? [] };
}
