"use client";

import type { AnalyzedDrink, DrinkType } from "@/lib/types";
import { DRINK_TYPES, estimateStandardDrinks } from "@/lib/drinks";

type Props = {
  value: AnalyzedDrink;
  onChange: (next: AnalyzedDrink) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  aiNote?: string;
  when?: string;
  onWhenChange?: (value: string) => void;
  saveLabel?: string;
  onDelete?: () => void;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900";

const ML_PER_FLOZ = 29.5735;

export default function DrinkForm({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  aiNote,
  when,
  onWhenChange,
  saveLabel = "Log it",
  onDelete,
}: Props) {
  const std = estimateStandardDrinks(Number(value.volume_ml), Number(value.abv_percent));
  const flOz = value.volume_ml ? Math.round((value.volume_ml / ML_PER_FLOZ) * 10) / 10 : 0;

  // Changing the volume rescales calories proportionally (keeps calories-per-ml constant).
  function setVolume(rawMl: number) {
    const newMl = Math.max(0, Math.round(rawMl));
    const oldMl = Number(value.volume_ml) || 0;
    const oldCal = Number(value.calories) || 0;
    const calories = oldMl > 0 && newMl > 0 ? Math.round(oldCal * (newMl / oldMl)) : oldCal;
    onChange({ ...value, volume_ml: newMl, calories });
  }

  return (
    <div className="space-y-3">
      {aiNote && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          {aiNote}
        </div>
      )}

      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
        Name
        <input
          className={inputCls}
          placeholder="e.g. Modelo Especial"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>

      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
        Type
        <select
          className={inputCls}
          value={value.drink_type}
          onChange={(e) => onChange({ ...value, drink_type: e.target.value as DrinkType })}
        >
          {DRINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Volume (ml)
          <input
            type="number"
            className={inputCls}
            value={value.volume_ml}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Volume (fl oz)
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={flOz}
            onChange={(e) => setVolume(Number(e.target.value) * ML_PER_FLOZ)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          ABV (%)
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={value.abv_percent}
            onChange={(e) => onChange({ ...value, abv_percent: Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Calories
          <input
            type="number"
            className={inputCls}
            value={value.calories}
            onChange={(e) => onChange({ ...value, calories: Number(e.target.value) })}
          />
        </label>
      </div>

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

      <p className="text-xs text-stone-400 dark:text-stone-500">
        ≈ {std.toFixed(1)} standard drink{std.toFixed(1) === "1.0" ? "" : "s"} · calories adjust with
        volume
      </p>

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
          className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
        >
          {saving ? "Logging…" : saveLabel}
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
