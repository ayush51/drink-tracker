import type { AnalyzedDrink, DrinkType } from "@/lib/types";

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
