import Icon from "./icon";
import { useTheme } from "../context/theme-context";

type Status = "done" | "pending" | "running";

export default function ActivityRow({
  icon,
  label,
  sub,
  time,
  status,
}: {
  icon: string;
  label: string;
  sub: string;
  time: string;
  status: Status;
}) {
  const { dark } = useTheme();

  const badge = {
    done: dark
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-emerald-50 text-emerald-700",
    pending: dark
      ? "bg-amber-500/15 text-amber-400"
      : "bg-amber-50 text-amber-700",
    running: dark
      ? "bg-indigo-500/15 text-indigo-400"
      : "bg-indigo-50 text-indigo-700",
  };

  const labelMap = { done: "Complete", pending: "Pending", running: "Running" };

  return (
    <div
      className={`flex items-center gap-4 py-3 border-b last:border-0 ${
        dark ? "border-slate-700" : "border-slate-100"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
          dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
        }`}
      >
        <Icon name={icon} className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${dark ? "text-white" : "text-slate-900"}`}
        >
          {label}
        </p>
        <p
          className={`text-xs truncate ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          {sub}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge[status]}`}
        >
          {labelMap[status]}
        </span>
        <span
          className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
