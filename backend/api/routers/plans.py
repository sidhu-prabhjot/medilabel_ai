from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from backend.api.db.supabase import supabase
from backend.api.auth.auth import get_current_user
from backend.api.schemas.plan_record import (
    WorkoutPlanCreate,
    WorkoutPlanUpdate,
    PlanRoutineDayCreate,
    PlanRoutineDayUpdate,
)

router = APIRouter(prefix="/api")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def verify_plan_ownership(plan_id: int, user_id: UUID):
    result = (
        supabase.table("workout_plans")
        .select("id, user_id")
        .eq("id", plan_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Workout plan not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_plan_day_ownership(plan_day_id: int, user_id: UUID):
    result = (
        supabase.table("plan_routine_days")
        .select("""
            id,
            plan_id,
            workout_plans (
                id,
                user_id
            )
        """)
        .eq("id", plan_day_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Plan day not found")

    if result.data[0]["workout_plans"]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_routine_belongs_to_user(routine_id: int, user_id: UUID):
    result = (
        supabase.table("workout_routines")
        .select("id, user_id")
        .eq("id", routine_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Workout routine not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


# ------------------------------------------------------------------
# Workout plan routes
# ------------------------------------------------------------------

@router.post("/workout-plans")
async def create_workout_plan(
    plan: WorkoutPlanCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("workout_plans")
        .insert({
            "user_id": str(user_id),
            "name": plan.name,
            "description": plan.description,
        })
        .execute()
    )
    return {"success": True, "plan": response.data}


@router.get("/workout-plans")
async def get_all_workout_plans(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("workout_plans")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "plans": response.data}


@router.get("/workout-plans/{plan_id}")
async def get_workout_plan(
    plan_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)

    response = (
        supabase.table("workout_plans")
        .select("*")
        .eq("id", plan_id)
        .execute()
    )
    return {"success": True, "plan": response.data[0]}


@router.put("/workout-plans/{plan_id}")
async def update_workout_plan(
    plan_id: int,
    updated_plan: WorkoutPlanUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)

    update_data = updated_plan.dict(exclude_unset=True)

    response = (
        supabase.table("workout_plans")
        .update(update_data)
        .eq("id", plan_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "updated_plan": response.data}


@router.delete("/workout-plans/{plan_id}")
async def delete_workout_plan(
    plan_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    supabase.table("workout_plans").delete().eq("id", plan_id).eq("user_id", str(user_id)).execute()
    return {"success": True}


# ------------------------------------------------------------------
# Plan routine day routes
# ------------------------------------------------------------------

@router.post("/workout-plans/{plan_id}/days")
async def add_day_to_plan(
    plan_id: int,
    plan_day: PlanRoutineDayCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    verify_routine_belongs_to_user(plan_day.routine_id, user_id)

    response = (
        supabase.table("plan_routine_days")
        .insert({
            "plan_id": plan_id,
            "routine_id": plan_day.routine_id,
            "weekday": plan_day.weekday,
            "notes": plan_day.notes,
        })
        .execute()
    )
    return {"success": True, "plan_day": response.data}


@router.get("/workout-plans/{plan_id}/days")
async def get_all_days_in_plan(
    plan_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)

    response = (
        supabase.table("plan_routine_days")
        .select("*")
        .eq("plan_id", plan_id)
        .order("weekday", desc=False)
        .execute()
    )
    return {"success": True, "plan_days": response.data}


@router.get("/workout-plans/{plan_id}/days/{plan_day_id}")
async def get_plan_day(
    plan_id: int,
    plan_day_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)

    response = (
        supabase.table("plan_routine_days")
        .select("*")
        .eq("id", plan_day_id)
        .eq("plan_id", plan_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Plan day not found")

    return {"success": True, "plan_day": response.data[0]}


@router.put("/workout-plans/{plan_id}/days/{plan_day_id}")
async def update_plan_day(
    plan_id: int,
    plan_day_id: int,
    updated_day: PlanRoutineDayUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    verify_plan_day_ownership(plan_day_id, user_id)

    update_data = updated_day.dict(exclude_unset=True)

    if "routine_id" in update_data:
        verify_routine_belongs_to_user(update_data["routine_id"], user_id)

    response = (
        supabase.table("plan_routine_days")
        .update(update_data)
        .eq("id", plan_day_id)
        .eq("plan_id", plan_id)
        .execute()
    )
    return {"success": True, "updated_plan_day": response.data}


@router.delete("/workout-plans/{plan_id}/days/{plan_day_id}")
async def delete_plan_day(
    plan_id: int,
    plan_day_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    verify_plan_day_ownership(plan_day_id, user_id)

    supabase.table("plan_routine_days").delete().eq("id", plan_day_id).eq("plan_id", plan_id).execute()
    return {"success": True}