import type { AnalyzedDrink, DrinkType, LogEntry } from "@/lib/types";

export const DRINK_TYPES: DrinkType[] = [
  "beer",
  "wine",
  "spirit",
  "cocktail",
  "seltzer",
  "non-alcoholic",
  "other",
];

export const DRINK_EMOJI: Record<DrinkType, string> = {
  beer: "🍺",
  wine: "🍷",
  spirit: "🥃",
  cocktail: "🍸",
  seltzer: "🥤",
  "non-alcoholic": "🧃",
  other: "🍹",
};

export function todayLocal(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function blankDraft(): AnalyzedDrink {
  return {
    name: "",
    drink_type: "beer",
    volume_ml: 355,
    abv_percent: 5,
    calories: 150,
  };
}

/** Estimate US standard drinks (14g pure alcohol each) for live display in forms. */
export function estimateStandardDrinks(volumeMl: number, abvPercent: number) {
  return (volumeMl * (abvPercent / 100) * 0.789) / 14;
}

/** ISO string -> value for an <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value -> ISO string. */
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

/** Distinct recently-logged drinks (newest first) for quick re-logging. */
export function favoriteDrinks(drinks: LogEntry[], n = 4): AnalyzedDrink[] {
  const seen = new Set<string>();
  const out: AnalyzedDrink[] = [];
  for (const d of drinks) {
    const key = d.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: d.name,
      drink_type: d.drink_type,
      volume_ml: d.volume_ml,
      abv_percent: d.abv_percent,
      calories: d.calories,
    });
    if (out.length >= n) break;
  }
  return out;
}

export function fileToBase64(
  file: File
): Promise<{ image: string; mediaType: string }> {
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
