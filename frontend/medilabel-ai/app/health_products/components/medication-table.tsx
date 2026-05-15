"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import {
  UserMedication,
  StockFormValues,
} from "../../src/types/health_products";
import { addStock, deleteStock } from "../../src/api/health_product.api";

interface Props {
  userMedications: UserMedication[];
  onRefresh: () => void;
}

// ── Restock inline form ────────────────────────────────────────────────────────

function RestockForm({
  medicationId,
  onDone,
}: {
  medicationId: number;
  onDone: () => void;
}) {
  const { dark } = useTheme();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    const stock: StockFormValues = {
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      expiration_date: expirationDate || undefined,
      notes: notes || undefined,
    };
    try {
      await addStock(medicationId, stock);
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-2 mb-3 p-3 rounded-lg space-y-3 ${
        dark ? "bg-slate-700/40" : "bg-slate-50"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        Add Stock
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label
            className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Qty
          </label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="30"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Unit
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="tablets"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Expiry
          </label>
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label
          className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          Notes
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional…"
          className={inputCls}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-50 transition-colors"
        >
          <Icon name="add" className="text-sm" />
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            dark
              ? "bg-slate-600 hover:bg-slate-500 text-slate-300"
              : "bg-slate-200 hover:bg-slate-300 text-slate-700"
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Expiry badge helper ────────────────────────────────────────────────────────

function ExpiryBadge({
  dateStr,
  dark,
}: {
  dateStr: string | null;
  dark: boolean;
}) {
  if (!dateStr)
    return (
      <span className={dark ? "text-slate-500" : "text-slate-400"}>—</span>
    );

  const expiry = new Date(dateStr);
  const today = new Date();
  const daysUntil = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntil < 0) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">
        Expired
      </span>
    );
  }
  if (daysUntil <= 30) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
        {daysUntil}d left
      </span>
    );
  }
  return (
    <span
      className={`text-xs tabular-nums ${dark ? "text-slate-300" : "text-slate-700"}`}
    >
      {expiry.toLocaleDateString()}
    </span>
  );
}

// ── Main table component ───────────────────────────────────────────────────────

export default function MedicationTable({ userMedications, onRefresh }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700" : "border-slate-200";

  const [restockingId, setRestockingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(medicationId: number, stockId: number) {
    setDeletingId(medicationId);
    try {
      await deleteStock(medicationId, stockId);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (userMedications.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
        <Icon name="medication" className="text-4xl opacity-40" />
        <p className="text-sm">
          No medications yet. Search above to add your first one.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={`border-b text-left ${divider}`}>
          <th
            className={`py-2 font-medium text-xs uppercase tracking-wide ${muted}`}
          >
            Name
          </th>
          <th
            className={`font-medium text-xs uppercase tracking-wide ${muted}`}
          >
            Type
          </th>
          <th
            className={`font-medium text-xs uppercase tracking-wide ${muted}`}
          >
            Stock
          </th>
          <th
            className={`font-medium text-xs uppercase tracking-wide ${muted}`}
          >
            Expires
          </th>
          <th
            className={`font-medium text-xs uppercase tracking-wide ${muted}`}
          >
            Notes
          </th>
          <th />
        </tr>
      </thead>

      <tbody>
        {userMedications.map(({ stock, medication }) => (
          <tr
            key={stock.stock_id}
            className={`border-b ${divider} transition-colors`}
          >
            <td colSpan={6} className="py-0">
              {/* Main row */}
              <div className="flex items-center gap-3 py-2.5">
                {/* Name */}
                <span className={`flex-1 font-medium ${heading}`}>
                  {medication.name}
                </span>

                {/* Brand / Generic badge */}
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    medication.is_brand
                      ? dark
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-purple-50 text-purple-700"
                      : dark
                        ? "bg-slate-600 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {medication.is_brand ? "Brand" : "Generic"}
                </span>

                {/* Quantity */}
                <span
                  className={`tabular-nums text-xs min-w-[4rem] text-right ${dark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {stock.quantity != null ? (
                    `${stock.quantity}${stock.unit ? ` ${stock.unit}` : ""}`
                  ) : (
                    <span className={muted}>—</span>
                  )}
                </span>

                {/* Expiry */}
                <span className="min-w-[6rem] text-right">
                  <ExpiryBadge dateStr={stock.expiration_date} dark={dark} />
                </span>

                {/* Notes */}
                <span
                  className={`hidden md:block max-w-[10rem] truncate text-xs ${muted}`}
                >
                  {stock.notes || "—"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() =>
                      setRestockingId(
                        restockingId === stock.stock_id ? null : stock.stock_id,
                      )
                    }
                    title="Add stock"
                    className={`p-1.5 rounded-lg transition-colors ${
                      dark
                        ? "hover:bg-slate-600 text-slate-400 hover:text-indigo-300"
                        : "hover:bg-slate-100 text-slate-400 hover:text-indigo-600"
                    }`}
                  >
                    <Icon name="add_box" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDelete(medication.medication_id, stock.stock_id)}
                    disabled={deletingId === medication.medication_id}
                    title="Remove medication"
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                      dark
                        ? "hover:bg-red-500/15 text-slate-400 hover:text-red-400"
                        : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                    }`}
                  >
                    <Icon name="delete" className="text-base" />
                  </button>
                </div>
              </div>

              {/* Inline restock form */}
              {restockingId === stock.stock_id && (
                <RestockForm
                  medicationId={medication.medication_id}
                  onDone={() => {
                    setRestockingId(null);
                    onRefresh();
                  }}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
