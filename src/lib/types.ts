export type DrinkType =
  | "beer"
  | "wine"
  | "spirit"
  | "cocktail"
  | "seltzer"
  | "non-alcoholic"
  | "other";

export type AnalyzedDrink = {
  name: string;
  drink_type: DrinkType;
  volume_ml: number;
  abv_percent: number;
  calories: number;
  confidence?: "high" | "medium" | "low";
  description?: string;
};

export type LogEntry = {
  id: number;
  created_at: string;
  name: string;
  drink_type: DrinkType;
  volume_ml: number;
  abv_percent: number;
  calories: number;
  standard_drinks: number;
  notes: string | null;
};
