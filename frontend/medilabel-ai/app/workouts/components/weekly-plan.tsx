"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { WorkoutPlan, WorkoutRoutine, PlanRoutineDay } from "../../src/types/workouts";
import {
  createPlan,
  deletePlan,
  getPlanDays,
  addPlanDay,
  deletePlanDay,
} from "../../src/api/workouts.api";

interface Props {
  plans: WorkoutPlan[];
  routines: WorkoutRoutine[];
  onRefresh: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Single day cell ────────────────────────────────────────────────────────────

function DayCell({
  weekday,
  assignments,
  routines,
  planId,
  onChanged,
  dark,
}: {
  weekday: number;
  assignments: PlanRoutineDay[];
  routines: WorkoutRoutine[];
  planId: number;
  onChanged: () => void;
  dark: boolean;
}) {
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const [showPicker, setShowPicker] = useState(false);
  const [adding, setAdding] = useState(false);

  const routineMap = new Map(routines.map((r) => [r.id, r]));

  async function handleAdd(routineId: number) {
    setAdding(true);
    try {
      await addPlanDay(planId, { routine_id: routineId, weekday });
      onChanged();
      setShowPicker(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(planDayId: number) {
    await deletePlanDay(planId, planDayId);
    onChanged();
  }

  const assignedRoutineIds = new Set(assignments.map((a) => a.routine_id));
  const availableRoutines = routines.filter((r) => !assignedRoutineIds.has(r.id));

  return (
    <div
      className={`flex flex-col gap-1.5 min-h-[6rem] rounded-xl border p-3 transition-colors ${
        dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      {/* Day label */}
      <span className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
        {DAYS[weekday]}
      </span>

      {/* Assigned routines */}
      {assignments.map((a) => {
        const routine = routineMap.get(a.routine_id);
        return (
          <div
            key={a.id}
            className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            <span className="truncate">{routine?.routine_name ?? `Routine #${a.routine_id}`}</span>
            <button
              onClick={() => handleRemove(a.id)}
              className="opacity-60 hover:opacity-100 flex-shrink-0"
            >
              <Icon name="close" className="text-xs" />
            </button>
          </div>
        );
      })}

      {/* Add button / picker */}
      {availableRoutines.length > 0 && (
        showPicker ? (
          <div className={`rounded-lg border space-y-0.5 overflow-hidden ${dark ? "border-slate-600" : "border-slate-200"}`}>
            {availableRoutines.map((r) => (
              <button
                key={r.id}
                onClick={() => handleAdd(r.id)}
                disabled={adding}
                className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${
                  dark ? "hover:bg-slate-600 text-slate-300" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                {r.routine_name}
              </button>
            ))}
            <button
              onClick={() => setShowPicker(false)}
              className={`w-full text-center px-2 py-1 text-xs ${muted} border-t ${dark ? "border-slate-600" : "border-slate-200"}`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className={`flex items-center gap-1 text-xs transition-colors ${muted} hover:${dark ? "text-slate-200" : "text-slate-600"}`}
          >
            <Icon name="add" className="text-sm" />
            Add
          </button>
        )
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WeeklyPlan({ plans, routines, onRefresh }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    plans[0]?.id ?? null,
  );
  const [planDays, setPlanDays] = useState<PlanRoutineDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDays = useCallback(async () => {
    if (!selectedPlanId) { setPlanDays([]); return; }
    setLoadingDays(true);
    try {
      const days = await getPlanDays(selectedPlanId);
      setPlanDays(days);
    } finally {
      setLoadingDays(false);
    }
  }, [selectedPlanId]);

  useEffect(() => { loadDays(); }, [loadDays]);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  async function handleCreatePlan(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!planName.trim()) return;
    setCreating(true);
    try {
      const newPlan = await createPlan({
        name: planName.trim(),
        description: planDesc.trim() || undefined,
      });
      setPlanName("");
      setPlanDesc("");
      setShowCreateForm(false);
      onRefresh();
      setSelectedPlanId(newPlan.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePlan(planId: number) {
    setDeletingId(planId);
    try {
      await deletePlan(planId);
      onRefresh();
      setSelectedPlanId(plans.find((p) => p.id !== planId)?.id ?? null);
    } finally {
      setDeletingId(null);
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Group plan days by weekday
  const dayMap = new Map<number, PlanRoutineDay[]>();
  for (let i = 0; i < 7; i++) dayMap.set(i, []);
  for (const d of planDays) {
    dayMap.get(d.weekday)?.push(d);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={`text-sm font-semibold ${heading}`}>Weekly Plan</h2>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            showCreateForm
              ? dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          <Icon name={showCreateForm ? "expand_less" : "add"} className="text-sm" />
          {showCreateForm ? "Close" : "New Plan"}
        </button>
      </div>

      {/* Create plan form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreatePlan}
          className={`rounded-xl border p-4 space-y-3 ${
            dark ? "bg-slate-700/30 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${muted}`}>Plan Name *</label>
              <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. 5-day PPL" required className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${muted}`}>Description</label>
              <input value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Optional" className={inputCls} />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !planName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Icon name="add" className="text-base" />
            {creating ? "Creating…" : "Create Plan"}
          </button>
        </form>
      )}

      {/* Plan tabs */}
      {plans.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedPlanId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlanId === p.id
                    ? dark
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-indigo-50 text-indigo-700"
                    : dark
                      ? "text-slate-400 hover:bg-slate-700"
                      : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {p.name}
              </button>
              <button
                onClick={() => handleDeletePlan(p.id)}
                disabled={deletingId === p.id}
                className={`p-1 rounded-lg transition-colors disabled:opacity-40 ${
                  dark ? "text-slate-600 hover:text-red-400" : "text-slate-300 hover:text-red-500"
                }`}
              >
                <Icon name="close" className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 7-day grid */}
      {selectedPlan ? (
        loadingDays ? (
          <div className={`flex items-center gap-2 py-6 text-sm ${muted}`}>
            <Icon name="progress_activity" className="text-base" />
            Loading schedule…
          </div>
        ) : routines.length === 0 ? (
          <p className={`text-sm ${muted}`}>Create some routines first, then assign them to days here.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <DayCell
                key={i}
                weekday={i}
                assignments={dayMap.get(i) ?? []}
                routines={routines}
                planId={selectedPlan.id}
                onChanged={loadDays}
                dark={dark}
              />
            ))}
          </div>
        )
      ) : (
        <div className={`flex flex-col items-center gap-2 py-8 ${muted}`}>
          <Icon name="calendar_month" className="text-4xl opacity-40" />
          <p className="text-sm">No plans yet. Create one to build your weekly schedule.</p>
        </div>
      )}
    </div>
  );
}
