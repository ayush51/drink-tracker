"use client";

import { useMemo, useState } from "react";
import type { AnalyzedDrink, LogEntry } from "@/lib/types";
import {
  todayLocal,
  fileToBase64,
  blankDraft,
  favoriteDrinks,
  toLocalInput,
  fromLocalInput,
  DRINK_EMOJI,
} from "@/lib/drinks";
import { useDrinks, addDrink, deleteDrink } from "@/lib/drinkStore";
import { useProfile, greetingFor } from "@/lib/profile";
import { underLimitStreak, estimateBAC } from "@/lib/stats";
import ProgressRing from "@/components/ProgressRing";
import DrinkForm from "@/components/DrinkForm";
import DrinkListItem from "@/components/DrinkListItem";
import DrinkEditModal from "@/components/DrinkEditModal";
import Insights from "@/components/Insights";

const nowLocalInput = () => toLocalInput(new Date().toISOString());

type Mode = "idle" | "photo" | "editing";

export default function TrackPage() {
  const profile = useProfile();

  const [mode, setMode] = useState<Mode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ image: string; mediaType: string } | null>(
    null
  );
  const [hint, setHint] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalyzedDrink>(blankDraft());
  const [aiNote, setAiNote] = useState<string | undefined>(undefined);
  const [when, setWhen] = useState(nowLocalInput);
  const [quantity, setQuantity] = useState(1);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [nudge, setNudge] = useState(false);

  function maybeNudge(drink: AnalyzedDrink) {
    if (Number(drink.abv_percent) > 0) {
      setNudge(true);
      setTimeout(() => setNudge(false), 4500);
    }
  }

  const allDrinks = useDrinks();
  const today = todayLocal();
  const logs = useMemo(
    () => allDrinks.filter((d) => todayLocal(new Date(d.created_at)) === today),
    [allDrinks, today]
  );
  const favorites = useMemo(() => favoriteDrinks(allDrinks), [allDrinks]);

  function resetCapture() {
    setMode("idle");
    setPreviewUrl(null);
    setPendingImage(null);
    setHint("");
    setWhen(nowLocalInput());
    setQuantity(1);
    setDraft(blankDraft());
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
        body: JSON.stringify({ ...pendingImage, hint: hint.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error || "Analysis failed");
        return;
      }
      setDraft({
        name: data.name ?? "",
        drink_type: data.drink_type ?? "beer",
        volume_ml: data.volume_ml ?? 355,
        abv_percent: data.abv_percent ?? 5,
        calories: data.calories ?? 150,
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
    setDraft(blankDraft());
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
    for (let i = 0; i < n; i++) addDrink(draft, iso);
    maybeNudge(draft);
    resetCapture();
  }

  function handleDelete(id: string) {
    deleteDrink(id);
  }

  function quickLog(fav: AnalyzedDrink) {
    addDrink(fav);
    maybeNudge(fav);
  }

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalStd = logs.reduce((sum, l) => sum + l.standard_drinks, 0);
  const limit = profile.dailyLimitDrinks;
  const overLimit = limit > 0 && totalStd > limit;
  const streak = underLimitStreak(allDrinks, limit);

  const weightKg = profile.weightUnit === "lb" ? profile.weight * 0.453592 : profile.weight;
  const bac = profile.sex ? estimateBAC(logs, weightKg, profile.sex) : null;

  // Center of the ring: countdown toward the limit, or a plain tally if no limit set.
  let ringLabel: string;
  let ringSublabel: string;
  if (limit <= 0) {
    ringLabel = totalStd.toFixed(1);
    ringSublabel = "drinks";
  } else if (overLimit) {
    ringLabel = `+${(totalStd - limit).toFixed(1)}`;
    ringSublabel = "over limit";
  } else {
    ringLabel = (limit - totalStd).toFixed(1);
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
          <p className="mt-0.5 text-sm font-semibold italic text-amber-600 dark:text-amber-400">
            “{profile.motto}”
          </p>
        )}
        {streak >= 2 && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            🔥 {streak} days under your limit
          </p>
        )}
        <div className="mt-3 flex items-center gap-5">
          <ProgressRing value={totalStd} goal={limit} label={ringLabel} sublabel={ringSublabel} />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {Math.round(totalCalories)}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">calories today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                {logs.length}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                drink{logs.length === 1 ? "" : "s"} logged
              </div>
            </div>
          </div>
        </div>
        {overLimit && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            You&apos;re over your daily limit of {limit} standard drink{limit === 1 ? "" : "s"}.
          </p>
        )}
        {bac !== null && bac > 0 && (
          <div className="mt-3 rounded-lg bg-stone-100 px-3 py-2 dark:bg-stone-800">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Estimated BAC
              </span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                ~{bac.toFixed(3)}%
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-stone-400">
              Rough estimate only — never use it to decide whether it&apos;s safe to drive.
            </p>
          </div>
        )}
      </section>

      {/* Add a drink */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        {mode !== "editing" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
              Log a drink
            </h2>

            <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 text-center dark:border-stone-700">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Selected drink" className="mx-auto max-h-60 w-full object-contain" />
              ) : (
                <span className="flex flex-col items-center gap-2 px-6 py-8 text-sm text-stone-500 dark:text-stone-400">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h5l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                    <circle cx="12" cy="12.5" r="3.5" />
                  </svg>
                  Take or choose a photo
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {pendingImage && (
              <>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Optional note — e.g. draft IPA, 16 fl oz"
                  className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900"
                />
                <p className="mt-1 px-1 text-[11px] text-stone-400">
                  Helpful when there&apos;s no label — like a draft beer in a glass.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-amber-500/10"
                    >
                      <span>{DRINK_EMOJI[fav.drink_type] ?? "🍹"}</span>
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
              {aiNote ? "Confirm the details" : "Enter drink details"}
            </h2>
            <DrinkForm
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
        {logs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
            Nothing logged yet today.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <DrinkListItem
                key={log.id}
                log={log}
                onDelete={handleDelete}
                onEdit={setEditing}
                showTime
              />
            ))}
          </ul>
        )}
      </section>

      <Insights />

      <DrinkEditModal log={editing} onClose={() => setEditing(null)} />

      {nudge && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
          <div className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            💧 Logged — have a glass of water too
          </div>
        </div>
      )}
    </main>
  );
}
