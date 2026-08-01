"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useChallengeMembership,
  challengePhase,
  daysUntilAugust,
  localAugustProgress,
} from "@/lib/challenge";
import { useDrinks } from "@/lib/drinkStore";

export default function AbstainAugustBanner() {
  const membership = useChallengeMembership();
  const drinks = useDrinks();
  const [dismissed, setDismissed] = useState(false);

  const phase = challengePhase();
  if (dismissed || phase === "ended") return null;

  if (!membership) {
    return (
      <Link
        href="/abstain-august"
        className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-700 p-4 text-white shadow-sm"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            setDismissed(true);
          }}
          aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-full bg-white/20 p-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="pr-6 text-sm font-semibold">🌵 Join Abstain August</div>
        <p className="mt-0.5 pr-6 text-xs text-white/85">
          {phase === "upcoming"
            ? `Starts in ${daysUntilAugust()} days — 31 days, no alcohol, with the crew.`
            : "No alcohol, all month — track your streak with the crew."}
        </p>
      </Link>
    );
  }

  if (phase === "active") {
    const progress = localAugustProgress(drinks);
    return (
      <Link
        href="/abstain-august"
        className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-700 px-4 py-2.5 text-white shadow-sm"
      >
        <span className="text-xs font-semibold">
          🌵 Abstain August · Day {progress.daysElapsed}
        </span>
        <span className="text-xs font-bold">
          {progress.brokenOn ? "broke streak" : `${progress.dryDays} dry days`}
        </span>
      </Link>
    );
  }

  return null;
}
