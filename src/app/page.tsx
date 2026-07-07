"use client";

import { useEffect, useState, useCallback } from "react";
import type { AnalyzedDrink, LogEntry } from "@/lib/types";
import { todayLocal, fileToBase64, blankDraft } from "@/lib/drinks";
import { useProfile, greetingFor } from "@/lib/profile";
import ProgressRing from "@/components/ProgressRing";
import DrinkForm from "@/components/DrinkForm";
import DrinkListItem from "@/components/DrinkListItem";

type Mode = "idle" | "photo" | "editing";

export default function TrackPage() {
  const profile = useProfile();

  const [mode, setMode] = useState<Mode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ image: string; mediaType: string } | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalyzedDrink>(blankDraft());
  const [aiNote, setAiNote] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchTodayLogs = useCallback(() => fetch(`/api/logs?date=${todayLocal()}`), []);

  const refreshLogs = useCallback(async () => {
    const res = await fetchTodayLogs();
    if (res.ok) setLogs(await res.json());
  }, [fetchTodayLogs]);

  useEffect(() => {
    fetchTodayLogs()
      .then((res) => (res.ok ? res.json() : []))
      .then(setLogs);
  }, [fetchTodayLogs]);

  function resetCapture() {
    setMode("idle");
    setPreviewUrl(null);
    setPendingImage(null);
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
        body: JSON.stringify(pendingImage),
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
    setMode("editing");
  }

  async function handleSave() {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        resetCapture();
        await refreshLogs();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/logs?id=${id}`, { method: "DELETE" });
    await refreshLogs();
  }

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalStd = logs.reduce((sum, l) => sum + l.standard_drinks, 0);
  const goal = profile.dailyGoalDrinks;
  const overGoal = goal > 0 && totalStd > goal;

  return (
    <main className="space-y-6">
      {/* Greeting + daily summary */}
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {greetingFor(profile.name)} 👋
        </p>
        <div className="mt-3 flex items-center gap-5">
          <ProgressRing
            value={totalStd}
            goal={goal}
            label={totalStd.toFixed(1)}
            sublabel={goal > 0 ? `of ${goal} goal` : "drinks"}
          />
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
        {overGoal && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            You&apos;re over your daily goal of {goal} standard drinks.
          </p>
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
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {pendingImage && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
              >
                {analyzing ? "Analyzing…" : "Analyze photo"}
              </button>
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
              saving={saving}
              aiNote={aiNote}
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
              <DrinkListItem key={log.id} log={log} onDelete={handleDelete} showTime />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
