import type { AnalyzedSession, SessionEntry, SessionMethod } from "@/lib/types";

export const SESSION_METHODS: SessionMethod[] = [
  "flower",
  "edible",
  "vape",
  "concentrate",
  "other",
];

export const METHOD_EMOJI: Record<SessionMethod, string> = {
  flower: "🌸",
  edible: "🍬",
  vape: "💨",
  concentrate: "🍯",
  other: "🌿",
};

export function blankSessionDraft(): AnalyzedSession {
  return { name: "", method: "flower", amount: "", thc_percent: 0, notes: "" };
}

/** Distinct recently-logged sessions (newest first) for quick re-logging. */
export function favoriteSessions(sessions: SessionEntry[], n = 4): AnalyzedSession[] {
  const seen = new Set<string>();
  const out: AnalyzedSession[] = [];
  for (const s of sessions) {
    const key = s.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: s.name,
      method: s.method,
      amount: s.amount,
      thc_percent: s.thc_percent,
      notes: s.notes,
    });
    if (out.length >= n) break;
  }
  return out;
}
