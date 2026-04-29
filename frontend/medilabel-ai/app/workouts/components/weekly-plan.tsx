"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { WorkoutPlan, WorkoutRoutine, PlanRoutineDay, PlanRestDay } from "../../src/types/workouts";
import {
  createPlan,
  deletePlan,
  activatePlan,
  getPlanDays,
  addPlanDay,
  deletePlanDay,
  getPlanRestDays,
  addRestDay,
  deleteRestDay,
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
  restDay,
  routines,
  planId,
  onChanged,
  dark,
}: {
  weekday: number;
  assignments: PlanRoutineDay[];
  restDay: PlanRestDay | null;
  routines: WorkoutRoutine[];
  planId: number;
  onChanged: () => void;
  dark: boolean;
}) {
  const muted        = dark ? "text-neutral-400" : "text-[#A3B18A]";
  const [showPicker,   setShowPicker]   = useState(false);
  const [adding,       setAdding]       = useState(false);
  const [togglingRest, setTogglingRest] = useState(false);

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

  async function handleToggleRest() {
    setTogglingRest(true);
    try {
      if (restDay) {
        await deleteRestDay(planId, restDay.id);
      } else {
        await addRestDay(planId, weekday);
      }
      onChanged();
    } finally {
      setTogglingRest(false);
    }
  }

  const assignedRoutineIds  = new Set(assignments.map((a) => a.routine_id));
  const availableRoutines   = routines.filter((r) => !assignedRoutineIds.has(r.id));
  const isRest              = restDay !== null;

  return (
    <div
      className={`flex flex-col gap-1.5 min-h-[6rem] rounded-xl border p-3 transition-all duration-200 ${
        isRest
          ? dark
            ? "bg-neutral-950/50 border-neutral-800 opacity-60"
            : "bg-[#F5F3EE] border-[#DAD7CD]/30 opacity-70"
          : dark
            ? "bg-neutral-900 border-neutral-800"
            : "bg-white border-[#DAD7CD]/30 shadow-[0_4px_16px_-4px_rgba(47,62,47,0.06)]"
      }`}
    >
      {/* Day label */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>
          {DAYS[weekday]}
        </span>
        {(isRest || assignments.length === 0) && (
          <button
            onClick={handleToggleRest}
            disabled={togglingRest}
            title={isRest ? "Unmark rest day" : "Mark as rest day"}
            className={`text-xs transition-colors disabled:opacity-40 ${
              isRest
                ? dark ? "text-neutral-500 hover:text-neutral-300" : "text-[#A3B18A] hover:text-[#4F6F52]"
                : dark ? "text-neutral-700 hover:text-neutral-500" : "text-[#DAD7CD] hover:text-[#A3B18A]"
            }`}
          >
            <Icon name={isRest ? "close" : "hotel"} className="text-sm" />
          </button>
        )}
      </div>

      {isRest && (
        <span className={`text-[10px] font-medium uppercase tracking-wider ${muted}`}>
          Rest day
        </span>
      )}

      {/* Assigned routines */}
      {!isRest && assignments.map((a) => {
        const routine = routineMap.get(a.routine_id);
        return (
          <div
            key={a.id}
            className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              dark
                ? "bg-[#4F6F52]/20 text-green-400"
                : "bg-[#4F6F52]/10 text-[#4F6F52]"
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
      {!isRest && availableRoutines.length > 0 && (
        showPicker ? (
          <div
            className={`rounded-lg border space-y-0.5 overflow-hidden ${
              dark ? "border-neutral-700 bg-neutral-900" : "border-[#DAD7CD]/40 bg-white"
            }`}
          >
            {availableRoutines.map((r) => (
              <button
                key={r.id}
                onClick={() => handleAdd(r.id)}
                disabled={adding}
                className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${
                  dark
                    ? "hover:bg-neutral-800 text-neutral-300"
                    : "hover:bg-[#F5F3EE] text-[#4F6F52]"
                }`}
              >
                {r.routine_name}
              </button>
            ))}
            <button
              onClick={() => setShowPicker(false)}
              className={`w-full text-center px-2 py-1 text-xs border-t ${
                dark ? "border-neutral-700 text-neutral-500" : "border-[#DAD7CD]/40 text-[#A3B18A]"
              }`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            className={`flex items-center gap-1 text-xs transition-colors ${muted} hover:opacity-70`}
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
  const heading = dark ? "text-white"       : "text-[#4F6F52]";
  const muted   = dark ? "text-neutral-400" : "text-[#A3B18A]";

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(plans[0]?.id ?? null);
  const [planDays,       setPlanDays]        = useState<PlanRoutineDay[]>([]);
  const [planRestDays,   setPlanRestDays]    = useState<PlanRestDay[]>([]);
  const [loadingDays,    setLoadingDays]     = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planName,       setPlanName]       = useState("");
  const [planDesc,       setPlanDesc]       = useState("");
  const [creating,       setCreating]       = useState(false);
  const [deletingId,     setDeletingId]     = useState<number | null>(null);
  const [activatingId,   setActivatingId]   = useState<number | null>(null);

  const loadDays = useCallback(async () => {
    if (!selectedPlanId) { setPlanDays([]); setPlanRestDays([]); return; }
    setLoadingDays(true);
    try {
      const [days, restDays] = await Promise.all([
        getPlanDays(selectedPlanId),
        getPlanRestDays(selectedPlanId),
      ]);
      setPlanDays(days);
      setPlanRestDays(restDays);
    } finally {
      setLoadingDays(false);
    }
  }, [selectedPlanId]);

  useEffect(() => { loadDays(); }, [loadDays]);

  const inputCls = `w-full px-4 py-3.5 rounded-lg border-none outline-none text-sm focus:ring-2 transition-colors ${
    dark
      ? "bg-neutral-800 text-white placeholder-neutral-500 focus:ring-green-700"
      : "bg-[#F5F3EE] text-[#4F6F52] placeholder-[#A3B18A]/60 focus:ring-[#4F6F52]/20"
  }`;

  const labelCls = `text-[11px] font-bold tracking-widest uppercase px-1 ${muted}`;

  async function handleCreatePlan(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!planName.trim()) return;
    setCreating(true);
    try {
      const newPlan = await createPlan({
        name:        planName.trim(),
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

  async function handleActivatePlan(planId: number) {
    setActivatingId(planId);
    try {
      await activatePlan(planId);
      onRefresh();
    } finally {
      setActivatingId(null);
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const dayMap = new Map<number, PlanRoutineDay[]>();
  for (let i = 0; i < 7; i++) dayMap.set(i, []);
  for (const d of planDays) {
    dayMap.get(d.weekday)?.push(d);
  }

  const restDayMap = new Map<number, PlanRestDay>();
  for (const rd of planRestDays) {
    restDayMap.set(rd.weekday, rd);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={`text-[11px] font-bold tracking-[0.2em] uppercase ${muted}`}>
          Weekly Plan
        </h2>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all duration-200 ${
            showCreateForm
              ? dark
                ? "bg-neutral-800 text-neutral-300"
                : "bg-[#F5F3EE] text-[#4F6F52]"
              : dark
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-[#4F6F52] hover:bg-[#3d5a3e] text-white"
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
          className={`rounded-3xl border p-6 space-y-4 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
            dark
              ? "bg-neutral-900 border-neutral-800"
              : "bg-white border-[#DAD7CD]/40"
          }`}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Plan Name *</label>
              <input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. 5-day PPL"
                required
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Description</label>
              <input
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !planName.trim()}
            className={`flex items-center gap-1.5 px-6 py-3 rounded-full text-white text-sm font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-[1.01] ${
              dark ? "bg-green-700 hover:bg-green-600" : "bg-[#4F6F52] hover:bg-[#3d5a3e]"
            }`}
          >
            <Icon name="add" className="text-base" />
            {creating ? "Creating…" : "Create Plan"}
          </button>
        </form>
      )}

      {/* Plan selector tabs */}
      {plans.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedPlanId(p.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedPlanId === p.id
                    ? dark
                      ? "bg-[#4F6F52]/20 text-green-400"
                      : "bg-[#4F6F52]/10 text-[#4F6F52]"
                    : dark
                      ? "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                      : "text-[#A3B18A] hover:bg-[#F5F3EE] hover:text-[#4F6F52]"
                }`}
              >
                {p.is_active && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      dark ? "bg-green-400" : "bg-[#4F6F52]"
                    }`}
                  />
                )}
                {p.name}
              </button>
              {!p.is_active && (
                <button
                  onClick={() => handleActivatePlan(p.id)}
                  disabled={activatingId === p.id}
                  title="Set as active plan"
                  className={`p-1.5 rounded-full transition-colors disabled:opacity-40 ${
                    dark
                      ? "text-neutral-600 hover:text-green-400 hover:bg-green-900/20"
                      : "text-[#DAD7CD] hover:text-[#4F6F52] hover:bg-[#4F6F52]/5"
                  }`}
                >
                  <Icon name="check_circle" className="text-sm" />
                </button>
              )}
              <button
                onClick={() => handleDeletePlan(p.id)}
                disabled={deletingId === p.id}
                className={`p-1.5 rounded-full transition-colors disabled:opacity-40 ${
                  dark
                    ? "text-neutral-700 hover:text-red-400 hover:bg-red-500/10"
                    : "text-[#DAD7CD] hover:text-red-500 hover:bg-red-50"
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
            <Icon name="progress_activity" className="text-base animate-spin" />
            Loading schedule…
          </div>
        ) : routines.length === 0 ? (
          <p className={`text-sm ${muted}`}>
            Create some routines first, then assign them to days here.
          </p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <DayCell
                key={i}
                weekday={i}
                assignments={dayMap.get(i) ?? []}
                restDay={restDayMap.get(i) ?? null}
                routines={routines}
                planId={selectedPlan.id}
                onChanged={loadDays}
                dark={dark}
              />
            ))}
          </div>
        )
      ) : (
        <div className={`flex flex-col items-center gap-3 py-16 ${muted}`}>
          <Icon name="calendar_month" className="text-5xl opacity-30" />
          <p className="text-sm font-medium">
            No plans yet. Create one to build your weekly schedule.
          </p>
        </div>
      )}
    </div>
  );
}
