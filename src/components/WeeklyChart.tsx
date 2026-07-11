import { todayLocal } from "@/lib/drinks";

export type ChartBar = { date: string; label: string; value: number };

export default function WeeklyChart({
  data,
  limit,
  formatTooltip,
}: {
  data: ChartBar[];
  limit: number;
  formatTooltip?: (v: number) => string;
}) {
  const max = Math.max(limit || 0, ...data.map((d) => d.value), 1);
  const today = todayLocal();
  const fmt = formatTooltip ?? ((v: number) => v.toFixed(1));

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
            const over = limit > 0 && d.value > limit;
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className={`w-full rounded-t ${over ? "bg-rose-500" : ""} ${
                    d.value === 0 ? "min-h-[2px] bg-stone-200 dark:bg-stone-800" : ""
                  }`}
                  style={{
                    height: d.value > 0 ? `${(d.value / max) * 100}%` : undefined,
                    backgroundColor: over || d.value === 0 ? undefined : "var(--accent-solid)",
                  }}
                  title={fmt(d.value)}
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
            className="flex-1 text-center text-[11px] font-medium"
            style={{
              color: d.date === today ? "var(--accent-solid)" : undefined,
            }}
          >
            <span className={d.date === today ? "" : "text-stone-400 dark:text-stone-500"}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
