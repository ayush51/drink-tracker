"use client";

import { useMode } from "@/lib/mode";
import AlcoholHistory from "@/components/AlcoholHistory";
import WeedHistory from "@/components/WeedHistory";

export default function HistoryPage() {
  const mode = useMode();
  return mode === "weed" ? <WeedHistory /> : <AlcoholHistory />;
}
