"use client";

import { useMode, setMode } from "@/lib/mode";

export default function AppHeader() {
  const mode = useMode();
  const isWeed = mode === "weed";

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-sm">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
          {isWeed ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c1.5 3 1.5 5 0 8 1.5-1 3.5-1 5 1-2 0-3.5 1-4 2.5 2-.5 4 0 5 2-2.5.5-4 0-5.5-1 .5 2 0 4-1.5 5.5C9.5 18.5 9 16.5 9.5 14.5 8 15.5 6.5 16 4 15.5c1-2 3-2.5 5-2-.5-1.5-2-2.5-4-2.5 1.5-2 3.5-2 5-1-1.5-3-1.5-5 0-8 .5 1.5 1 3 2 4-1-1.5-1.5-3-2-4Z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16l-8 9-8-9Z" />
              <path d="M12 13v6M8 21h8" />
              <path d="M9 7h6" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-lg font-bold tracking-tight">
            {isWeed ? "Session Happens" : "Sip Happens"}
          </div>
          <div className="truncate text-[11px] font-medium text-white/80">
            {isWeed ? "Cannabis session tracker" : "Drink & calorie tracker"}
          </div>
        </div>

        <button
          onClick={() => setMode(isWeed ? "alcohol" : "weed")}
          aria-label="Toggle weed mode"
          className={`relative h-7 w-14 shrink-0 rounded-full bg-white/20 ring-1 ring-white/30 transition-colors ${
            isWeed ? "bg-white/30" : ""
          }`}
        >
          <span
            className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow transition-transform ${
              isWeed ? "translate-x-7" : "translate-x-0.5"
            }`}
          >
            {isWeed ? "🌿" : "🍸"}
          </span>
        </button>
      </div>
    </header>
  );
}
