import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DRINK_PROMPT = `You are helping someone log a drink they photographed for a personal drinking/calorie tracker.
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

const WEED_PROMPT = `You are helping someone log a cannabis product they photographed for a personal, harm-reduction session tracker.
Look at the image and identify the product. Respond with ONLY a JSON object matching these exact fields:
{
  "name": string (e.g. "Blue Dream", "Wyld Raspberry Gummy", strain/product name if visible),
  "method": one of "flower" | "edible" | "vape" | "concentrate" | "other",
  "amount": string (best estimate of a single serving, e.g. "0.3g", "1 gummy (10mg)", "1 hit"),
  "thc_percent": number (estimated THC percent or mg if printed on packaging; 0 if unknown),
  "notes": string (empty string if nothing notable),
  "confidence": "high" | "medium" | "low",
  "description": string (one short sentence on what visual cues led to this guess)
}
If you cannot identify a cannabis product in the image at all, set "name" to "Unknown", confidence to "low", and still provide reasonable best-guess values for a standard single serving.`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const { image, mediaType, hint, domain } = await req.json();
  const trimmedHint = typeof hint === "string" ? hint.trim() : "";
  if (!image && !trimmedHint) {
    return NextResponse.json({ error: "No image or description provided" }, { status: 400 });
  }

  const basePrompt = domain === "weed" ? WEED_PROMPT : DRINK_PROMPT;
  let promptText = basePrompt;
  if (trimmedHint && image) {
    promptText = `${basePrompt}\n\nThe user added this note — trust it, it may give the exact name or serving size (e.g. "16 fl oz" ≈ 473 ml, "12 fl oz" ≈ 355 ml, "1 pint" ≈ 473 ml for drinks): "${trimmedHint}"`;
  } else if (trimmedHint) {
    promptText = `${basePrompt}\n\nThere is no photo. The user is describing the item from memory instead: "${trimmedHint}". Use your knowledge of typical brands, drinks, and serving sizes to give your best estimate.`;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contents: (
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  )[] = [{ text: promptText }];
  if (image) {
    contents.push({ inlineData: { mimeType: mediaType || "image/jpeg", data: image } });
  }

  let raw = "";
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
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
