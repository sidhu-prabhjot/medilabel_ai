"use client";

import { useState } from "react";

export default function StockManager({
  medicationId,
}: {
  medicationId: string;
}) {
  const [amount, setAmount] = useState("");

  async function addStock() {
    await fetch(`/api/medications/${medicationId}/stock`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  return (
    <div className="flex gap-2">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border rounded px-2 py-1"
        placeholder="Add stock"
      />

      <button
        onClick={addStock}
        className="bg-green-600 text-white px-3 py-1 rounded"
      >
        Add
      </button>
    </div>
  );
}
