"use client";

import { useTheme } from "../../src/context/theme-context";
import { TodayDoseItem } from "../../src/types/tracking";
import Icon from "../../src/components/icon";

interface Props {
  items: TodayDoseItem[];
  onLog: (scheduleId: number, status: "taken" | "missed") => void;
}

export default function MedicationChecklist({ items, onLog }: Props) {
  const { dark } = useTheme();

  if (items.length === 0) {
    return (
      <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
        No medication schedules set up yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const taken = item.status === "taken";
        const missed = item.status === "missed";

        return (
          <li
            key={item.schedule_id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              item.is_overdue && !taken
                ? dark
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-red-50 border-red-200"
                : dark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                  {item.medication_name}
                </p>
                {item.is_overdue && !taken && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                    Overdue
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {item.frequency}
                {item.doses_remaining != null && ` · ${item.doses_remaining} ${item.stock_unit ?? "doses"} left`}
                {item.next_dose_at && !taken && ` · Due ${new Date(item.next_dose_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>

            {taken || missed ? (
              <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg ${
                taken
                  ? dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                  : dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}>
                <Icon name={taken ? "check_circle" : "cancel"} className="text-base" />
                {taken ? "Taken" : "Missed"}
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onLog(item.schedule_id, "taken")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dark
                      ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <Icon name="check" className="text-base" />
                  Taken
                </button>
                <button
                  onClick={() => onLog(item.schedule_id, "missed")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dark
                      ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Icon name="close" className="text-base" />
                  Missed
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
