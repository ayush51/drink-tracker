"use client";

const PROFILE_KEY = "dt_profile";
const DRINKS_KEY = "dt_drinks";

/** Bundle profile + drink log into a portable JSON string. */
export function exportBackup(): string {
  const profile = localStorage.getItem(PROFILE_KEY);
  const drinks = localStorage.getItem(DRINKS_KEY);
  return JSON.stringify(
    {
      app: "sip-happens",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: profile ? JSON.parse(profile) : null,
      drinks: drinks ? JSON.parse(drinks) : [],
    },
    null,
    2
  );
}

/** Trigger a download of the backup file. */
export function downloadBackup() {
  const blob = new Blob([exportBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sip-happens-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restore a backup. Caller should reload the page on success. */
export function importBackup(text: string): { ok: boolean; error?: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "That doesn't look like a Sip Happens backup." };
  }
  const obj = data as { profile?: unknown; drinks?: unknown };
  if (obj.drinks !== undefined && !Array.isArray(obj.drinks)) {
    return { ok: false, error: "Backup is missing a valid drink list." };
  }
  if (obj.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(obj.profile));
  if (obj.drinks) localStorage.setItem(DRINKS_KEY, JSON.stringify(obj.drinks));
  return { ok: true };
}
