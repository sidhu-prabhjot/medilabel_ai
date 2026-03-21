"use client";

import { useEffect, useState } from "react";
import Card from "../../src/components/card";

export default function WorkoutSummary() {
  const [workouts, setWorkouts] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/workouts");
    const data = await res.json();
    setWorkouts(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <h2 className="font-semibold mb-3">Recent Workouts</h2>

      <div className="space-y-2">
        {workouts.map((w) => (
          <div key={w.id} className="flex justify-between text-sm">
            <span>{w.type}</span>
            <span>{w.duration} min</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
