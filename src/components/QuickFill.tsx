"use client";

import { useState } from "react";
import { fileToBase64 } from "@/lib/drinks";

type Props = {
  domain: "alcohol" | "weed";
  placeholder: string;
  onFilled: (data: Record<string, unknown>) => void;
};

/** Optional text description + reference photo that asks the AI to fill in the form below. */
export default function QuickFill({ domain, placeholder, onFilled }: Props) {
  const [text, setText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ image: string; mediaType: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    const { image, mediaType } = await fileToBase64(file);
    setPendingImage({ image, mediaType });
  }

  function clearPhoto() {
    setPreviewUrl(null);
    setPendingImage(null);
  }

  async function fill() {
    if (!text.trim() && !pendingImage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(pendingImage ?? {}), hint: text.trim(), domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't fill in details");
        return;
      }
      onFilled(data);
    } catch {
      setError("Could not reach the analysis API");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-dashed border-stone-300 p-3 dark:border-stone-700">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        Quick fill (optional)
      </p>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--accent-solid)]/30 dark:border-stone-700 dark:bg-stone-900"
      />

      <div className="mt-2 flex items-center gap-2">
        {previewUrl ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Reference" className="h-14 w-14 rounded-lg object-cover" />
            <button
              onClick={clearPhoto}
              aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        ) : (
          <label className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 text-stone-400 dark:border-stone-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h5l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        <button
          onClick={fill}
          disabled={busy || (!text.trim() && !pendingImage)}
          className="flex-1 rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {busy ? "Filling…" : "Fill in details"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <p className="mt-2 text-[11px] text-stone-400">
        Describe it, attach a reference photo, or both — the fields below fill in for you to check.
      </p>
    </div>
  );
}
