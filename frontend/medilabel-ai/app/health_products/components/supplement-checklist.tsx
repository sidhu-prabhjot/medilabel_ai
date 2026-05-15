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
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#c2c8bf]"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-[#1a1c1a]"}`}>
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
                    ? "bg-[#c8ecc8]0/15 text-[#acd0ad] hover:bg-[#c8ecc8]0/25"
                    : "bg-[#c8ecc8] text-[#2f4e33] hover:bg-[#c8ecc8]"
                  : dark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-[#eeeeea] text-[#424841] hover:bg-[#e8e8e4]"
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
