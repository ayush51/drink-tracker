"use client";

import type { AnalyzedSession, SessionMethod } from "@/lib/types";
import { SESSION_METHODS } from "@/lib/weed";

type Props = {
  value: AnalyzedSession;
  onChange: (next: AnalyzedSession) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  aiNote?: string;
  when?: string;
  onWhenChange?: (value: string) => void;
  quantity?: number;
  onQuantityChange?: (n: number) => void;
  saveLabel?: string;
  onDelete?: () => void;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--accent-solid)]/30 dark:border-stone-700 dark:bg-stone-900";

export default function WeedForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  aiNote,
  when,
  onWhenChange,
  quantity,
  onQuantityChange,
  saveLabel = "Log it",
  onDelete,
}: Props) {
  return (
    <div className="space-y-3">
      {aiNote && (
        <div
          className="rounded-lg px-3 py-2 text-xs text-stone-700 dark:text-stone-200"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent-solid) 12%, transparent)" }}
        >
          {aiNote}
        </div>
      )}

      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
        Name
        <input
          className={inputCls}
          placeholder="e.g. Blue Dream, Wyld Gummy"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>

      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
        Method
        <select
          className={inputCls}
          value={value.method}
          onChange={(e) => onChange({ ...value, method: e.target.value as SessionMethod })}
        >
          {SESSION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Amount
          <input
            className={inputCls}
            placeholder="e.g. 0.3g, 1 gummy"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
          />
        </label>
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          THC % (optional)
          <input
            type="number"
            step="0.1"
            min="0"
            className={inputCls}
            value={value.thc_percent}
            onChange={(e) => onChange({ ...value, thc_percent: Number(e.target.value) })}
          />
        </label>
      </div>

      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
        Notes (optional)
        <input
          className={inputCls}
          placeholder="e.g. with friends, relaxing"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </label>

      {onQuantityChange && (
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          How many? (optional)
          <input
            type="number"
            min="1"
            step="1"
            className={inputCls}
            value={quantity ?? 1}
            onChange={(e) => onQuantityChange(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
          />
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            Logs this session multiple times at once.
          </span>
        </label>
      )}

      {onWhenChange && (
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          When
          <input
            type="datetime-local"
            className={inputCls}
            value={when ?? ""}
            onChange={(e) => onWhenChange(e.target.value)}
          />
        </label>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border border-stone-300 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !value.name.trim()}
          className="flex-1 rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {saving ? "Logging…" : quantity && quantity > 1 ? `Log ${quantity}` : saveLabel}
        </button>
      </div>

      {onDelete && (
        <button
          onClick={onDelete}
          className="w-full rounded-full py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          Delete this entry
        </button>
      )}
    </div>
  );
}
