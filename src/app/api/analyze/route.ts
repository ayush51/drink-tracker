import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const PROMPT = `You are helping someone log a drink they photographed for a personal drinking/calorie tracker.
Look at the image and identify the beverage. Respond with ONLY a JSON object (no markdown, no commentary, no code fences) with these exact fields:
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const { image, mediaType } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: image,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
  } catch (err) {
    const detail = err instanceof Anthropic.APIError ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Anthropic API request failed: ${detail}` },
      { status: 502 }
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

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
