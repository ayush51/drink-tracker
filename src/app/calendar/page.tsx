"use client";

import { useMode } from "@/lib/mode";
import AlcoholCalendar from "@/components/AlcoholCalendar";
import WeedCalendar from "@/components/WeedCalendar";

export default function CalendarPage() {
  const mode = useMode();
  return mode === "weed" ? <WeedCalendar /> : <AlcoholCalendar />;
}
