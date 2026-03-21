import Card from "./card";
import Icon from "./icon";
import { useTheme } from "../context/theme-context";

export default function StatCard({
  label,
  value,
  change,
  positive,
  barColor,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  barColor: string;
}) {
  const { dark } = useTheme();

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium uppercase tracking-wide ${
            dark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {label}
        </span>

        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            positive
              ? dark
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-emerald-50 text-emerald-700"
              : dark
                ? "bg-red-500/15 text-red-400"
                : "bg-red-50 text-red-700"
          }`}
        >
          <Icon
            name={positive ? "arrow_upward" : "arrow_downward"}
            className="w-6 h-6"
          />
          {change}
        </span>
      </div>

      <p
        className={`text-2xl font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}
      >
        {value}
      </p>

      <div
        className={`h-1 w-full rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}
      >
        <div
          className={`h-1 rounded-full ${barColor}`}
          style={{ width: "65%" }}
        />
      </div>
    </Card>
  );
}
