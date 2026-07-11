"use client";

import { useMode } from "@/lib/mode";
import AlcoholTrack from "@/components/AlcoholTrack";
import WeedTrack from "@/components/WeedTrack";

export default function TrackPage() {
  const mode = useMode();
  return mode === "weed" ? <WeedTrack /> : <AlcoholTrack />;
}
