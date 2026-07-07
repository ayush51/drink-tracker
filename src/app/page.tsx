"use client";

import { useEffect, useState, useCallback } from "react";
import type { AnalyzedDrink, DrinkType, LogEntry } from "@/lib/types";

const DRINK_TYPES: DrinkType[] = [
  "beer",
  "wine",
  "spirit",
  "cocktail",
  "seltzer",
  "non-alcoholic",
  "other",
];

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function fileToBase64(file: File): Promise<{ image: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [meta, image] = result.split(",");
      const mediaType = meta.match(/data:(.*);base64/)?.[1] || file.type;
      resolve({ image, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ image: string; mediaType: string } | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalyzedDrink | null>(null);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchTodayLogs = useCallback(() => fetch(`/api/logs?date=${todayLocal()}`), []);

  const refreshLogs = useCallback(async () => {
    const res = await fetchTodayLogs();
    if (res.ok) setLogs(await res.json());
  }, [fetchTodayLogs]);

  useEffect(() => {
    fetchTodayLogs().then((res) => (res.ok ? res.json() : [])).then(setLogs);
  }, [fetchTodayLogs]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzeError(null);
    setDraft(null);
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
      setDraft(data);
    } catch {
      setAnalyzeError("Could not reach the analysis API");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
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

  function resetCapture() {
    setPreviewUrl(null);
    setPendingImage(null);
    setDraft(null);
    setAnalyzeError(null);
  }

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalStandardDrinks = logs.reduce((sum, l) => sum + l.standard_drinks, 0);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Daily Drink Tracker</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
          <div className="text-xs text-black/50 dark:text-white/50">Today&apos;s calories</div>
          <div className="text-xl font-semibold">{Math.round(totalCalories)}</div>
        </div>
        <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
          <div className="text-xs text-black/50 dark:text-white/50">Standard drinks</div>
          <div className="text-xl font-semibold">{totalStandardDrinks.toFixed(1)}</div>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {!draft && (
          <>
            <label className="block cursor-pointer rounded-md border border-dashed border-black/20 p-6 text-center text-sm text-black/60 dark:border-white/25 dark:text-white/60">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Selected drink" className="mx-auto max-h-56 rounded-md" />
              ) : (
                "Tap to take or choose a photo"
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
                className="mt-3 w-full rounded-md bg-black py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {analyzing ? "Analyzing..." : "Analyze photo"}
              </button>
            )}
            {analyzeError && <p className="mt-2 text-sm text-red-600">{analyzeError}</p>}
          </>
        )}

        {draft && (
          <div className="space-y-3">
            {draft.description && (
              <p className="text-xs text-black/50 dark:text-white/50">
                AI guess ({draft.confidence} confidence): {draft.description}
              </p>
            )}

            <label className="block text-sm">
              Name
              <input
                className="mt-1 w-full rounded-md border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-transparent"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              Type
              <select
                className="mt-1 w-full rounded-md border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-transparent"
                value={draft.drink_type}
                onChange={(e) => setDraft({ ...draft, drink_type: e.target.value as DrinkType })}
              >
                {DRINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="block text-sm">
                Volume (ml)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-transparent"
                  value={draft.volume_ml}
                  onChange={(e) => setDraft({ ...draft, volume_ml: Number(e.target.value) })}
                />
              </label>
              <label className="block text-sm">
                ABV (%)
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded-md border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-transparent"
                  value={draft.abv_percent}
                  onChange={(e) => setDraft({ ...draft, abv_percent: Number(e.target.value) })}
                />
              </label>
              <label className="block text-sm">
                Calories
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-transparent"
                  value={draft.calories}
                  onChange={(e) => setDraft({ ...draft, calories: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={resetCapture}
                className="flex-1 rounded-md border border-black/15 py-2 text-sm dark:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-md bg-black py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? "Logging..." : "Log it"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60">Today</h2>
        <ul className="mt-2 space-y-2">
          {logs.length === 0 && (
            <li className="text-sm text-black/40 dark:text-white/40">Nothing logged yet today.</li>
          )}
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/15"
            >
              <div>
                <div className="text-sm font-medium">{log.name}</div>
                <div className="text-xs text-black/50 dark:text-white/50">
                  {log.drink_type} · {log.volume_ml}ml · {log.abv_percent}% ·{" "}
                  {Math.round(log.calories)} cal · {log.standard_drinks.toFixed(1)} std
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
