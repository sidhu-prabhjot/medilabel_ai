"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import {
  SearchResult,
  StockFormValues,
  isDbMedication,
  isRxNavResult,
} from "../../src/types/health_products";
import {
  searchMedications,
  addMedication,
  addStock,
} from "../../src/api/health_product.api";

interface Props {
  onStockAdded: () => void;
}

// ── Inline stock form ──────────────────────────────────────────────────────────

function StockForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (values: StockFormValues) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { dark } = useTheme();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [notes, setNotes] = useState("");

  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    onSubmit({
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
      expiration_date: expirationDate || undefined,
      opened_at: openedAt || undefined,
      notes: notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 px-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Quantity
          </label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 30"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Unit
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. tablets"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Expiry Date
          </label>
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Opened On
          </label>
          <input
            type="date"
            value={openedAt}
            onChange={(e) => setOpenedAt(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
          rows={2}
          maxLength={500}
          className={inputCls}
        />
      </div>

      <div className="flex gap-2 pb-1">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Icon name="add" className="text-base" />
          {loading ? "Adding…" : "Add to My Medications"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            dark
              ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main search component ──────────────────────────────────────────────────────

export default function MedicationSearch({ onStockAdded }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Index of the row with the stock form open
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Tracks which rows have been successfully added
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());

  async function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");
    setResults([]);
    setExpandedIndex(null);
    setAddedIndices(new Set());
    setHasSearched(true);

    try {
      const data = await searchMedications(query.trim());
      setResults(data);
    } catch {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAddStock(result: SearchResult, index: number, stock: StockFormValues) {
    setSubmitting(true);
    try {
      let medicationId: number;

      if (isDbMedication(result)) {
        medicationId = result.medication_id;
      } else if (isRxNavResult(result)) {
        const med = await addMedication({
          rxcui: result.properties.rxcui,
          name: result.properties.name,
          tty: result.properties.tty,
        });
        medicationId = med.medication_id;
      } else {
        return;
      }

      await addStock(medicationId, stock);
      setAddedIndices((prev) => new Set(prev).add(index));
      setExpandedIndex(null);
      onStockAdded();
    } catch {
      // Keep form open so the user can retry
    } finally {
      setSubmitting(false);
    }
  }

  function displayName(r: SearchResult): string {
    return isDbMedication(r) ? r.name : r.properties.name;
  }

  function displayRxcui(r: SearchResult): string {
    return isDbMedication(r) ? r.rxcui : r.properties.rxcui;
  }

  function displayTty(r: SearchResult): string {
    if (isDbMedication(r)) return r.is_brand ? "Brand" : "Generic";
    const tty = r.properties.tty.toUpperCase();
    if (tty === "BN" || tty === "SBD") return "Brand";
    if (tty === "SCD") return "Generic";
    return tty;
  }

  function isBrand(r: SearchResult): boolean {
    if (isDbMedication(r)) return r.is_brand;
    const tty = r.properties.tty.toLowerCase();
    return tty === "bn" || tty === "sbd";
  }

  const rowHover = dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50";
  const divider = dark ? "border-slate-700" : "border-slate-100";

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medications by name…"
          className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
            dark
              ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
          }`}
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icon
            name={searching ? "progress_activity" : "search"}
            className="text-base"
          />
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Error */}
      {searchError && (
        <p className="mt-3 text-sm text-red-500">{searchError}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-5">
          <p className={`text-xs font-medium uppercase tracking-wide mb-3 ${muted}`}>
            {results.length} result{results.length !== 1 ? "s" : ""} — select a row to add to your medications
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-left ${dark ? "border-slate-700" : "border-slate-200"}`}>
                <th className={`py-2 font-medium text-xs uppercase tracking-wide ${muted}`}>Name</th>
                <th className={`font-medium text-xs uppercase tracking-wide ${muted}`}>RXCUI</th>
                <th className={`font-medium text-xs uppercase tracking-wide ${muted}`}>Type</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`border-b ${divider} ${rowHover} transition-colors`}>
                  <td colSpan={4} className="py-0">
                    {/* Row summary line */}
                    <div className="flex items-center gap-3 py-2.5 px-0.5">
                      <span className={`flex-1 font-medium ${heading}`}>{displayName(r)}</span>
                      <span className={`text-xs tabular-nums ${muted}`}>{displayRxcui(r)}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isBrand(r)
                            ? dark
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-purple-50 text-purple-700"
                            : dark
                              ? "bg-slate-600 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {displayTty(r)}
                      </span>

                      {addedIndices.has(i) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                          <Icon name="check_circle" className="text-base" />
                          Added
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            setExpandedIndex(expandedIndex === i ? null : i)
                          }
                          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                            expandedIndex === i
                              ? dark
                                ? "bg-slate-600 text-slate-300"
                                : "bg-slate-200 text-slate-700"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          <Icon
                            name={expandedIndex === i ? "expand_less" : "add"}
                            className="text-base"
                          />
                          {expandedIndex === i ? "Close" : "Add Stock"}
                        </button>
                      )}
                    </div>

                    {/* Inline stock form */}
                    {expandedIndex === i && (
                      <div
                        className={`mb-3 rounded-lg p-3 ${
                          dark ? "bg-slate-700/40" : "bg-slate-50"
                        }`}
                      >
                        <StockForm
                          loading={submitting}
                          onCancel={() => setExpandedIndex(null)}
                          onSubmit={(values) => handleAddStock(r, i, values)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!searching && hasSearched && results.length === 0 && !searchError && (
        <p className={`mt-4 text-sm ${muted}`}>
          No medications found for &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}
