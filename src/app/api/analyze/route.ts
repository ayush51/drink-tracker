import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `You are helping someone log a drink they photographed for a personal drinking/calorie tracker.
Look at the image and identify the beverage. Respond with ONLY a JSON object matching these exact fields:
{
  "name": string (e.g. "Modelo Especial", "Glass of red wine"),
  "drink_type": one of "beer" | "wine" | "spirit" | "cocktail" | "seltzer" | "non-alcoholic" | "other",
  "volume_ml": number (best estimate of serving size in milliliters),
  "abv_percent": number (best estimate of alcohol by volume as a percent, 0 if non-alcoholic),
  "calories": number (best estimate of total calories for this serving),
  "confidence": "high" | "medium" | "low",
  "description": string (one short sentence on what visual cues led to this guess)
}
If you cannot identify a beverage in the image at all, set "name" to "Unknown", confidence to "low", and still provide reasonable best-guess numbers for a standard serving.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const { image, mediaType } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let raw = "";
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { text: PROMPT },
        { inlineData: { mimeType: mediaType || "image/jpeg", data: image } },
      ],
      config: { responseMimeType: "application/json" },
    });
    raw = response.text ?? "";
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gemini API request failed: ${detail}` },
      { status: 502 }
    );
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Could not parse the AI's response", raw },
      { status: 502 }
    );
  }
}
