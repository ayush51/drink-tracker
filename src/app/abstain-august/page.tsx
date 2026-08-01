"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useChallengeMembership,
  useGroup,
  joinChallenge,
  challengePhase,
  daysUntilAugust,
  localAugustProgress,
  abstainAugustBadgeEarned,
  fetchChallengeCrew,
  challengeSocialEnabled,
  type CrewRow,
} from "@/lib/challenge";
import { useDrinks } from "@/lib/drinkStore";
import { useProfile } from "@/lib/profile";
import { registerServiceWorker, subscribeToPush, pushSupported, type PushStatus } from "@/lib/push";
import { deviceId } from "@/lib/group";

export default function AbstainAugustPage() {
  const membership = useChallengeMembership();
  const groupMembership = useGroup();
  const profile = useProfile();
  const drinks = useDrinks();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>("unsubscribed");
  const [crew, setCrew] = useState<CrewRow[]>([]);

  const now = useMemo(() => new Date(), []);
  const phase = challengePhase(now);
  const progress = useMemo(() => localAugustProgress(drinks, now), [drinks, now]);
  const badgeEarned = abstainAugustBadgeEarned(membership, drinks, now);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!membership || !challengeSocialEnabled) return;
    fetchChallengeCrew(now).then(setCrew);
  }, [membership, now]);

  async function handleJoin() {
    setBusy(true);
    setError(null);
    const name = groupMembership?.name || profile.name;
    if (!name) {
      setError("Add your name in Profile first.");
      setBusy(false);
      return;
    }
    const res = await joinChallenge(name);
    if (!res.ok) {
      setError(res.error ?? "Could not join.");
      setBusy(false);
      return;
    }
    // best-effort: prompt for notifications right after joining
    const status = await subscribeToPush(deviceId(), name);
    setPushStatus(status);
    setBusy(false);
  }

  async function handleEnableNotifications() {
    const name = groupMembership?.name || profile.name || "Friend";
    const status = await subscribeToPush(deviceId(), name);
    setPushStatus(status);
  }

  const daysInAugust = 31;
  const pct = progress.daysElapsed > 0 ? (progress.dryDays / progress.daysElapsed) * 100 : 0;

  return (
    <main className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-700 p-6 text-white shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
          🌵 Community challenge
        </div>
        <h1 className="mt-1 text-2xl font-bold">Abstain August</h1>
        <p className="mt-1 text-sm text-white/90">
          No alcohol, all month. Join the crew going 31 days dry together.
        </p>

        {phase === "upcoming" && (
          <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium">
            Starts in {daysUntilAugust(now)} day{daysUntilAugust(now) === 1 ? "" : "s"} — August 1
          </p>
        )}
        {phase === "active" && (
          <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium">
            Day {progress.daysElapsed} of {daysInAugust}
          </p>
        )}
        {phase === "ended" && (
          <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium">
            August is over — here&apos;s how it went
          </p>
        )}
      </section>

      {!membership ? (
        <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            What&apos;s Abstain August?
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            A simple pact: no alcohol for the entire month of August. Track your streak here, see how
            your crew is doing, and earn the Abstain August badge if you make it all 31 days dry.
            You can join before, during, or any time — your progress counts from what you&apos;ve
            already logged.
          </p>
          <button
            onClick={handleJoin}
            disabled={busy}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
          >
            {busy ? "Joining…" : "Join the Abstain Crew"}
          </button>
          {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
        </section>
      ) : (
        <>
          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
            <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
              Your progress
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-stone-200 dark:stroke-stone-800" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                    className={progress.brokenOn ? "stroke-rose-500" : "stroke-emerald-500"}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                    {progress.dryDays}
                  </span>
                  <span className="text-[11px] text-stone-400">dry days</span>
                </div>
              </div>
              <div className="flex-1 space-y-1 text-sm">
                {progress.brokenOn ? (
                  <p className="font-medium text-rose-600 dark:text-rose-400">
                    Streak broke on{" "}
                    {new Date(progress.brokenOn + "T00:00:00").toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                ) : progress.daysElapsed > 0 ? (
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Still going strong 🌿
                  </p>
                ) : (
                  <p className="text-stone-400">August hasn&apos;t started yet.</p>
                )}
                <p className="text-stone-500 dark:text-stone-400">
                  {progress.daysElapsed} of {daysInAugust} days tracked
                </p>
              </div>
            </div>

            {pushSupported && pushStatus !== "subscribed" && (
              <button
                onClick={handleEnableNotifications}
                className="mt-4 w-full rounded-full border border-stone-300 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                🔔 Enable reminder notifications
              </button>
            )}
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
            <h2 className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
              Abstain August badge
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                  badgeEarned ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-stone-100 opacity-50 dark:bg-stone-800"
                }`}
              >
                <span className={badgeEarned ? "" : "grayscale"}>🌵</span>
              </span>
              <div className="text-sm">
                <p className="font-semibold text-stone-900 dark:text-stone-50">
                  {badgeEarned ? "Earned!" : "Locked"}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Stay dry all 31 days of August to unlock this one.
                </p>
              </div>
            </div>
          </section>

          {challengeSocialEnabled && (
            <section>
              <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500 dark:text-stone-400">
                The crew
              </h2>
              {crew.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
                  No one&apos;s joined yet — invite your friends!
                </p>
              ) : (
                <ul className="space-y-2">
                  {crew.map((c, i) => (
                    <li
                      key={c.deviceId}
                      className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
                    >
                      <span className="w-5 text-center text-sm font-bold text-stone-400">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
                            {c.name}
                          </span>
                          {!c.brokenOn && c.daysElapsed > 0 && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              🌿 perfect
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {c.brokenOn
                            ? `Broke on ${new Date(c.brokenOn + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })}`
                            : `${c.dryDays} dry day${c.dryDays === 1 ? "" : "s"}`}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-50">
                        {c.dryDays}/{c.daysElapsed}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
