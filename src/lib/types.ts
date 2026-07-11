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
  id: string;
  created_at: string;
  name: string;
  drink_type: DrinkType;
  volume_ml: number;
  abv_percent: number;
  calories: number;
  standard_drinks: number;
  notes: string | null;
};

export type SessionMethod = "flower" | "edible" | "vape" | "concentrate" | "other";

export type AnalyzedSession = {
  name: string;
  method: SessionMethod;
  amount: string;
  thc_percent: number;
  notes: string;
  confidence?: "high" | "medium" | "low";
  description?: string;
};

export type SessionEntry = {
  id: string;
  created_at: string;
  name: string;
  method: SessionMethod;
  amount: string;
  thc_percent: number;
  notes: string;
};
