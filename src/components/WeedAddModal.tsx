"use client";

import { useState } from "react";
import type { AnalyzedSession } from "@/lib/types";
import { blankSessionDraft } from "@/lib/weed";
import { fromLocalInput } from "@/lib/drinks";
import { addSession } from "@/lib/sessionStore";
import WeedForm from "@/components/WeedForm";
import QuickFill from "@/components/QuickFill";

function localInputForDate(date: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Sheet for logging a new session on a specific date. Renders nothing when `date` is null. */
export default function WeedAddModal({
  date,
  onClose,
}: {
  date: string | null;
  onClose: () => void;
}) {
  if (!date) return null;
  return <AddSheet key={date} date={date} onClose={onClose} />;
}

function AddSheet({ date, onClose }: { date: string; onClose: () => void }) {
  const [draft, setDraft] = useState<AnalyzedSession>(blankSessionDraft());
  const [when, setWhen] = useState(localInputForDate(date));
  const [quantity, setQuantity] = useState(1);
  const [aiNote, setAiNote] = useState<string | undefined>(undefined);

  function save() {
    if (!draft.name.trim()) return;
    const iso = fromLocalInput(when);
    const n = Math.min(20, Math.max(1, quantity));
    for (let i = 0; i < n; i++) addSession(draft, iso);
    onClose();
  }

  function handleFilled(data: Record<string, unknown>) {
    setDraft({
      name: (data.name as string) ?? draft.name,
      method: (data.method as AnalyzedSession["method"]) ?? draft.method,
      amount: (data.amount as string) ?? draft.amount,
      thc_percent: (data.thc_percent as number) ?? draft.thc_percent,
      notes: (data.notes as string) ?? draft.notes,
    });
    setAiNote(
      data.description
        ? `AI (${data.confidence ?? "?"} confidence): ${data.description} — edit anything that's off.`
        : "Edit anything the AI got wrong before logging."
    );
  }

  const label = new Date(date + "T00:00:00").toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <button aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-stone-50 p-5 shadow-xl dark:bg-stone-950 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Add session</h2>
            <p className="text-xs text-stone-400">{label}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <QuickFill domain="weed" placeholder="e.g. 1 gummy, Blue Dream joint" onFilled={handleFilled} />

        <WeedForm
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={onClose}
          aiNote={aiNote}
          when={when}
          onWhenChange={setWhen}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      </div>
    </div>
  );
}
