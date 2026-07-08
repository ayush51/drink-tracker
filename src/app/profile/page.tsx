"use client";

import { useState } from "react";
import { useProfile, saveProfile, type Profile } from "@/lib/profile";

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900";

export default function ProfilePage() {
  const profile = useProfile();
  // Re-seed the form whenever the stored profile changes (e.g. after save).
  const sig = `${profile.name}|${profile.motto}|${profile.dailyLimitDrinks}|${profile.costPerDrink}|${profile.baselineWeeklyDrinks}`;
  return <ProfileForm key={sig} initial={profile} />;
}

function ProfileForm({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [motto, setMotto] = useState(initial.motto);
  const [limit, setLimit] = useState(String(initial.dailyLimitDrinks));
  const [cost, setCost] = useState(String(initial.costPerDrink));
  const [baseline, setBaseline] = useState(String(initial.baselineWeeklyDrinks));
  const [savedAt, setSavedAt] = useState(0);

  function handleSave() {
    saveProfile({
      name: name.trim(),
      motto: motto.trim(),
      dailyLimitDrinks: Math.max(0, Number(limit) || 0),
      costPerDrink: Math.max(0, Number(cost) || 0),
      baselineWeeklyDrinks: Math.max(0, Number(baseline) || 0),
      onboarded: true,
    });
    setSavedAt(Date.now());
  }

  return (
    <main className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
        <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Your profile
        </h2>

        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
          Name
          <input
            className={inputCls}
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-stone-500 dark:text-stone-400">
          Motto
          <input
            className={inputCls}
            placeholder="e.g. No alcohol"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-stone-500 dark:text-stone-400">
          Daily limit (standard drinks)
          <input
            type="number"
            min="0"
            step="0.5"
            className={inputCls}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            The ring on the Track tab counts down from this and warns you when you go over. Set 0 to
            hide the limit.
          </span>
        </label>

        <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-800">
          <h3 className="mb-3 text-xs font-semibold text-stone-900 dark:text-stone-50">
            Progress tracking (optional)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Cost per drink ($)
              <input
                type="number"
                min="0"
                step="0.5"
                className={inputCls}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Typical week (drinks)
              <input
                type="number"
                min="0"
                step="1"
                className={inputCls}
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
              />
            </label>
          </div>
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            How much a drink usually costs you and how many you used to have per week — powers the
            &ldquo;money saved&rdquo; card on the History tab.
          </span>
        </div>

        <button
          onClick={handleSave}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Save
        </button>
        {savedAt > 0 && (
          <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Saved ✓
          </p>
        )}
      </section>

      <p className="px-2 text-center text-[11px] text-stone-400">
        Your profile and drink history are stored only on this device.
      </p>

      <footer className="pt-1 text-center text-[11px] font-medium text-stone-400">
        Made with 🍸 by Sober Ayush
      </footer>
    </main>
  );
}
