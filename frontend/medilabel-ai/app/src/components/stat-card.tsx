import { useTheme } from "../context/theme-context";

export default function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
  // legacy props — kept for compatibility, unused
  change?: string;
  positive?: boolean;
  barColor?: string;
}) {
  const { dark } = useTheme();

  return (
    <div
      className={`rounded-xl border p-6 transition-colors duration-200 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
        dark
          ? "bg-neutral-900 border-neutral-800"
          : "bg-white border-[#DAD7CD]/30"
      }`}
    >
      <p
        className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${
          dark ? "text-neutral-500" : "text-[#A3B18A]"
        }`}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-3xl font-extrabold tabular-nums leading-none ${
            dark ? "text-white" : "text-[#4F6F52]"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span
            className={`text-sm font-medium ${
              dark ? "text-neutral-500" : "text-[#A3B18A]"
            }`}
          >
            {unit.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
