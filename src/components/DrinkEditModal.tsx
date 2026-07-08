"use client";

import { useState } from "react";
import type { AnalyzedDrink, LogEntry } from "@/lib/types";
import { toLocalInput, fromLocalInput } from "@/lib/drinks";
import { updateDrink, deleteDrink } from "@/lib/drinkStore";
import DrinkForm from "@/components/DrinkForm";

/** Edit sheet for an existing entry. Renders nothing when `log` is null. */
export default function DrinkEditModal({
  log,
  onClose,
}: {
  log: LogEntry | null;
  onClose: () => void;
}) {
  if (!log) return null;
  return <EditSheet key={log.id} log={log} onClose={onClose} />;
}

function EditSheet({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const [draft, setDraft] = useState<AnalyzedDrink>({
    name: log.name,
    drink_type: log.drink_type,
    volume_ml: log.volume_ml,
    abv_percent: log.abv_percent,
    calories: log.calories,
  });
  const [when, setWhen] = useState(toLocalInput(log.created_at));

  function save() {
    if (!draft.name.trim()) return;
    updateDrink(log.id, draft, fromLocalInput(when));
    onClose();
  }

  function remove() {
    deleteDrink(log.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <button aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-stone-50 p-5 shadow-xl dark:bg-stone-950 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Edit drink</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <DrinkForm
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={onClose}
          when={when}
          onWhenChange={setWhen}
          saveLabel="Save changes"
          onDelete={remove}
        />
      </div>
    </div>
  );
}
