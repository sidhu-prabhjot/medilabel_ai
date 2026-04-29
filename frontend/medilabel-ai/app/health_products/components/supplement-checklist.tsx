"use client";

import { useTheme } from "../../src/context/theme-context";
import { SupplementTodayItem } from "../../src/types/tracking";
import Icon from "../../src/components/icon";

interface Props {
  items: SupplementTodayItem[];
  onToggle: (supplementId: number) => void;
}

export default function SupplementChecklist({ items, onToggle }: Props) {
  const { dark } = useTheme();

  if (items.length === 0) {
    return (
      <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
        No supplements added yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const taken = item.status === "taken";

        return (
          <li
            key={item.supplement_id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                {item.name}
              </p>
              {(item.dosage_amount || item.form) && (
                <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {item.dosage_amount && `${item.dosage_amount}${item.dosage_unit ?? ""}`}
                  {item.dosage_amount && item.form && " · "}
                  {item.form}
                </p>
              )}
            </div>

            <button
              onClick={() => onToggle(item.supplement_id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                taken
                  ? dark
                    ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : dark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon name={taken ? "check_circle" : "radio_button_unchecked"} className="text-base" />
              {taken ? "Taken" : "Mark taken"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
