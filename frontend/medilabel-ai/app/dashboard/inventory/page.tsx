"use client";
import DataTable from "../../src/components/DataTable";

export default function InventoryPage() {
  return (
    <div className="pt-8 px-6">
      <h1 className="text-2xl font-semibold mb-4 text-green-400">
        Medication Inventory Details
      </h1>
      <p className="text-gray-300 mb-6">
        View, add, or edit medications in your inventory below.
      </p>
      <DataTable />
    </div>
  );
}
