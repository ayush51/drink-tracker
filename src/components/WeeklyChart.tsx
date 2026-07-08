import type { DayBar } from "@/lib/stats";
import { todayLocal } from "@/lib/drinks";

export default function WeeklyChart({ data, limit }: { data: DayBar[]; limit: number }) {
  const max = Math.max(limit || 0, ...data.map((d) => d.std), 1);
  const today = todayLocal();

  return (
    <div>
      <div className="relative h-28">
        {limit > 0 && limit <= max && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-rose-400/70"
            style={{ bottom: `${(limit / max) * 100}%` }}
          />
        )}
        <div className="flex h-full items-end gap-1.5">
          {data.map((d) => {
            const over = limit > 0 && d.std > limit;
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className={`w-full rounded-t ${over ? "bg-rose-500" : "bg-amber-500"} ${
                    d.std === 0 ? "min-h-[2px] bg-stone-200 dark:bg-stone-800" : ""
                  }`}
                  style={{ height: d.std > 0 ? `${(d.std / max) * 100}%` : undefined }}
                  title={`${d.std.toFixed(1)} std`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d) => (
          <div
            key={d.date}
            className={`flex-1 text-center text-[11px] font-medium ${
              d.date === today
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
