"use client";

import { useRef, useState } from "react";
import { useProfile, saveProfile, type Profile } from "@/lib/profile";
import { downloadBackup, importBackup } from "@/lib/backup";
import { useTheme, setTheme, type Theme } from "@/lib/theme";

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--accent-solid)]/30 dark:border-stone-700 dark:bg-stone-900";

export default function ProfilePage() {
  const profile = useProfile();
  // Re-seed the form whenever the stored profile changes (e.g. after save).
  const sig = `${profile.name}|${profile.motto}|${profile.dailyLimitDrinks}|${profile.weeklyLimitDrinks}|${profile.dryDaysGoal}|${profile.costPerDrink}|${profile.baselineWeeklyDrinks}|${profile.weight}|${profile.weightUnit}|${profile.sex}|${profile.dailySessionLimit}`;
  return <ProfileForm key={sig} initial={profile} />;
}

function ProfileForm({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [motto, setMotto] = useState(initial.motto);
  const [limit, setLimit] = useState(String(initial.dailyLimitDrinks));
  const [weeklyLimit, setWeeklyLimit] = useState(String(initial.weeklyLimitDrinks));
  const [dryGoal, setDryGoal] = useState(String(initial.dryDaysGoal));
  const [cost, setCost] = useState(String(initial.costPerDrink));
  const [baseline, setBaseline] = useState(String(initial.baselineWeeklyDrinks));
  const [weight, setWeight] = useState(String(initial.weight || ""));
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">(initial.weightUnit);
  const [sex, setSex] = useState<Profile["sex"]>(initial.sex);
  const [sessionLimit, setSessionLimit] = useState(String(initial.dailySessionLimit));
  const [savedAt, setSavedAt] = useState(0);

  function handleSave() {
    saveProfile({
      name: name.trim(),
      motto: motto.trim(),
      dailyLimitDrinks: Math.max(0, Number(limit) || 0),
      weeklyLimitDrinks: Math.max(0, Number(weeklyLimit) || 0),
      dryDaysGoal: Math.min(7, Math.max(0, Number(dryGoal) || 0)),
      costPerDrink: Math.max(0, Number(cost) || 0),
      baselineWeeklyDrinks: Math.max(0, Number(baseline) || 0),
      weight: Math.max(0, Number(weight) || 0),
      weightUnit,
      sex,
      dailySessionLimit: Math.max(0, Number(sessionLimit) || 0),
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

        <label className="mt-4 block text-xs font-medium text-stone-500 dark:text-stone-400">
          🌿 Daily limit (weed mode sessions)
          <input
            type="number"
            min="0"
            step="1"
            className={inputCls}
            value={sessionLimit}
            onChange={(e) => setSessionLimit(e.target.value)}
          />
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            Used for the ring and streaks when weed mode is on (toggle it in the header).
          </span>
        </label>

        <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-800">
          <h3 className="mb-3 text-xs font-semibold text-stone-900 dark:text-stone-50">
            Weekly goals (optional)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Weekly limit (std drinks)
              <input
                type="number"
                min="0"
                step="1"
                className={inputCls}
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Alcohol-free days / week
              <input
                type="number"
                min="0"
                max="7"
                step="1"
                className={inputCls}
                value={dryGoal}
                onChange={(e) => setDryGoal(e.target.value)}
              />
            </label>
          </div>
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            Tracked on the History tab under &ldquo;This week.&rdquo; Set 0 to skip.
          </span>
        </div>

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

        <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-800">
          <h3 className="mb-3 text-xs font-semibold text-stone-900 dark:text-stone-50">
            BAC estimate (optional)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Weight
              <div className="mt-1 flex gap-1">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--accent-solid)]/30 dark:border-stone-700 dark:bg-stone-900"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <select
                  className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm outline-none dark:border-stone-700 dark:bg-stone-900"
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as "kg" | "lb")}
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </label>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400">
              Sex (for the formula)
              <select
                className={inputCls}
                value={sex}
                onChange={(e) => setSex(e.target.value as Profile["sex"])}
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>
          <span className="mt-1 block text-[11px] font-normal text-stone-400">
            Enables a rough BAC estimate on the Track tab. It&apos;s only an estimate — never use it
            to decide whether it&apos;s safe to drive.
          </span>
        </div>

        <button
          onClick={handleSave}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Save
        </button>
        {savedAt > 0 && (
          <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Saved ✓
          </p>
        )}
      </section>

      <ThemeControl />

      <DataBackup />

      <p className="px-2 text-center text-[11px] text-stone-400">
        Your profile and drink history are stored only on this device.
      </p>

      <footer className="pt-1 text-center text-[11px] font-medium text-stone-400">
        Made with 🍸 by Sober Ayush
      </footer>
    </main>
  );
}

function ThemeControl() {
  const theme = useTheme();
  const options: { value: Theme; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
      <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">Appearance</h2>
      <div className="flex gap-1 rounded-full bg-stone-100 p-1 dark:bg-stone-800">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
              theme === o.value
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-50"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importBackup(String(reader.result));
      if (result.ok) {
        setMsg({ ok: true, text: "Restored! Reloading…" });
        setTimeout(() => window.location.reload(), 700);
      } else {
        setMsg({ ok: false, text: result.error ?? "Import failed." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-stone-900">
      <h2 className="mb-1 text-sm font-semibold text-stone-900 dark:text-stone-50">Data & backup</h2>
      <p className="mb-3 text-[11px] text-stone-400">
        Export a file to back up or move your data to another device, then import it there.
      </p>
      <div className="flex gap-2">
        <button
          onClick={downloadBackup}
          className="flex-1 rounded-full border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Export
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-full border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {msg && (
        <p
          className={`mt-2 text-center text-xs font-medium ${
            msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}
