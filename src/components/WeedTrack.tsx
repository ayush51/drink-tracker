"use client";

import { useMemo, useState } from "react";
import type { AnalyzedSession, SessionEntry } from "@/lib/types";
import { todayLocal, fileToBase64, toLocalInput, fromLocalInput } from "@/lib/drinks";
import { blankSessionDraft, favoriteSessions, METHOD_EMOJI } from "@/lib/weed";
import { useSessions, addSession, deleteSession } from "@/lib/sessionStore";
import { useProfile, greetingFor } from "@/lib/profile";
import { underLimitStreakSessions } from "@/lib/weedStats";
import ProgressRing from "@/components/ProgressRing";
import WeedForm from "@/components/WeedForm";
import WeedListItem from "@/components/WeedListItem";
import WeedEditModal from "@/components/WeedEditModal";
import WeedInsights from "@/components/WeedInsights";

const nowLocalInput = () => toLocalInput(new Date().toISOString());

type Mode = "idle" | "photo" | "editing";

export default function WeedTrack() {
  const profile = useProfile();

  const [mode, setMode] = useState<Mode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ image: string; mediaType: string } | null>(
    null
  );
  const [hint, setHint] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalyzedSession>(blankSessionDraft());
  const [aiNote, setAiNote] = useState<string | undefined>(undefined);
  const [when, setWhen] = useState(nowLocalInput);
  const [quantity, setQuantity] = useState(1);
  const [editing, setEditing] = useState<SessionEntry | null>(null);

  const allSessions = useSessions();
  const today = todayLocal();
  const todaySessions = useMemo(
    () => allSessions.filter((s) => todayLocal(new Date(s.created_at)) === today),
    [allSessions, today]
  );
  const favorites = useMemo(() => favoriteSessions(allSessions), [allSessions]);

  function resetCapture() {
    setMode("idle");
    setPreviewUrl(null);
    setPendingImage(null);
    setHint("");
    setWhen(nowLocalInput());
    setQuantity(1);
    setDraft(blankSessionDraft());
    setAiNote(undefined);
    setAnalyzeError(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMode("photo");
    setAnalyzeError(null);
    setAiNote(undefined);
    setWhen(nowLocalInput());
    setPreviewUrl(URL.createObjectURL(file));
    const { image, mediaType } = await fileToBase64(file);
    setPendingImage({ image, mediaType });
  }

  async function handleAnalyze() {
    if (!pendingImage) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingImage, hint: hint.trim(), domain: "weed" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error || "Analysis failed");
        return;
      }
      setDraft({
        name: data.name ?? "",
        method: data.method ?? "flower",
        amount: data.amount ?? "",
        thc_percent: data.thc_percent ?? 0,
        notes: data.notes ?? "",
      });
      setAiNote(
        data.description
          ? `AI (${data.confidence ?? "?"} confidence): ${data.description} — edit anything that's off.`
          : "Edit anything the AI got wrong before logging."
      );
      setMode("editing");
    } catch {
      setAnalyzeError("Could not reach the analysis API");
    } finally {
      setAnalyzing(false);
    }
  }

  function startManual() {
    setDraft(blankSessionDraft());
    setAiNote(undefined);
    setPreviewUrl(null);
    setPendingImage(null);
    setWhen(nowLocalInput());
    setQuantity(1);
    setMode("editing");
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    const iso = fromLocalInput(when);
    const n = Math.min(20, Math.max(1, quantity));
    for (let i = 0; i < n; i++) addSession(draft, iso);
    resetCapture();
  }

  function handleDelete(id: string) {
    deleteSession(id);
  }

  function quickLog(fav: AnalyzedSession) {
    addSession(fav);
  }

  const limit = profile.dailySessionLimit;
  const count = todaySessions.length;
  const overLimit = limit > 0 && count > limit;
  const streak = underLimitStreakSessions(allSessions, limit);

  let ringLabel: string;
  let ringSublabel: string;
  if (limit <= 0) {
    ringLabel = String(count);
    ringSublabel = "sessions";
  } else if (overLimit) {
    ringLabel = `+${count - limit}`;
    ringSublabel = "over limit";
  } else {
    ringLabel = String(limit - count);
    ringSublabel = "left today";
  }

  return (
    <main className="space-y-6">
      {/* Greeting + daily summary */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {greetingFor(profile.name)} 👋
        </p>
        {profile.motto && (
          <p
            className="mt-0.5 text-sm font-semibold italic"
            style={{ color: "var(--accent-solid)" }}
          >
            “{profile.motto}”
          </p>
        )}
        {streak >= 2 && (
          <p
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent-solid) 12%, transparent)",
              color: "var(--accent-solid)",
            }}
          >
            🔥 {streak} days under your limit
          </p>
        )}
        <div className="mt-3 flex items-center gap-5">
          <ProgressRing value={count} goal={limit} label={ringLabel} sublabel={ringSublabel} />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-50">{count}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                session{count === 1 ? "" : "s"} today
              </div>
            </div>
          </div>
        </div>
        {overLimit && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            You&apos;re over your daily limit of {limit} session{limit === 1 ? "" : "s"}.
          </p>
        )}
      </section>

      <WeedInsights />

      {/* Log a session */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        {mode !== "editing" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
              Log a session
            </h2>

            <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 text-center dark:border-stone-700">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Selected product" className="mx-auto max-h-60 w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 px-6 py-8 text-sm text-stone-500 dark:text-stone-400">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-solid)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h5l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                    <circle cx="12" cy="12.5" r="3.5" />
                  </svg>
                  Take or choose a photo
                </span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {pendingImage && (
              <>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Optional note — e.g. 10mg gummy"
                  className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--accent-solid)]/30 dark:border-stone-700 dark:bg-stone-900"
                />
                <p className="mt-1 px-1 text-[11px] text-stone-400">
                  Helpful when there&apos;s no packaging in view.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
                >
                  {analyzing ? "Analyzing…" : "Analyze photo"}
                </button>
              </>
            )}
            {analyzeError && <p className="mt-2 text-sm text-rose-600">{analyzeError}</p>}

            <div className="my-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-stone-400">
              <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
              or
              <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>

            <button
              onClick={startManual}
              className="w-full rounded-full border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Log manually
            </button>

            {favorites.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Quick add
                </p>
                <div className="flex flex-wrap gap-2">
                  {favorites.map((fav) => (
                    <button
                      key={fav.name}
                      onClick={() => quickLog(fav)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-[var(--accent-solid)] hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                    >
                      <span>{METHOD_EMOJI[fav.method] ?? "🌿"}</span>
                      <span className="max-w-[9rem] truncate">{fav.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mode === "editing" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
              {aiNote ? "Confirm the details" : "Enter session details"}
            </h2>
            <WeedForm
              value={draft}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={resetCapture}
              aiNote={aiNote}
              when={when}
              onWhenChange={setWhen}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </>
        )}
      </section>

      {/* Today's list */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
          Today
        </h2>
        {todaySessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            Nothing logged yet today.
          </p>
        ) : (
          <ul className="space-y-2">
            {todaySessions.map((s) => (
              <WeedListItem
                key={s.id}
                session={s}
                onDelete={handleDelete}
                onEdit={setEditing}
                showTime
              />
            ))}
          </ul>
        )}
      </section>

      <WeedEditModal session={editing} onClose={() => setEditing(null)} />
    </main>
  );
}
