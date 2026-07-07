type Props = {
  value: number;
  goal: number;
  label: string;
  sublabel?: string;
};

export default function ProgressRing({ value, goal, label, sublabel }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;
  const dash = circumference * pct;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-stone-200 dark:stroke-stone-800"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={over ? "stroke-rose-500" : "stroke-amber-500"}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`text-2xl font-bold ${
            over ? "text-rose-600 dark:text-rose-400" : "text-stone-900 dark:text-stone-50"
          }`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
