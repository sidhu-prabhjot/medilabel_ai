from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.plan_record import (
    WorkoutPlanCreate,
    WorkoutPlanUpdate,
    WorkoutPlanResponse,
    PlanRoutineDayCreate,
    PlanRoutineDayUpdate,
    PlanRoutineDayResponse,
)
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Plans"])


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

@router.post("/workout-plans", response_model=DataResponse[WorkoutPlanResponse], status_code=201)
@limiter.limit("15/minute")
async def create_workout_plan(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/workout-plans", response_model=DataResponse[list[WorkoutPlanResponse]])
@limiter.limit("30/minute")
async def get_all_workout_plans(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("workout_plans")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.get("/workout-plans/{plan_id}", response_model=DataResponse[WorkoutPlanResponse])
@limiter.limit("30/minute")
async def get_workout_plan(
    request: Request,
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
    return {"data": response.data[0]}


@router.put("/workout-plans/{plan_id}", response_model=DataResponse[WorkoutPlanResponse])
@limiter.limit("15/minute")
async def update_workout_plan(
    request: Request,
    plan_id: int,
    updated_plan: WorkoutPlanUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)

    update_data = updated_plan.model_dump(exclude_unset=True)

    response = (
        supabase.table("workout_plans")
        .update(update_data)
        .eq("id", plan_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/workout-plans/{plan_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_workout_plan(
    request: Request,
    plan_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    supabase.table("workout_plans").delete().eq("id", plan_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Plan routine day routes
# ------------------------------------------------------------------

@router.post("/workout-plans/{plan_id}/days", response_model=DataResponse[PlanRoutineDayResponse], status_code=201)
@limiter.limit("15/minute")
async def add_day_to_plan(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/workout-plans/{plan_id}/days", response_model=DataResponse[list[PlanRoutineDayResponse]])
@limiter.limit("30/minute")
async def get_all_days_in_plan(
    request: Request,
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
    return {"data": response.data}


@router.get("/workout-plans/{plan_id}/days/{plan_day_id}", response_model=DataResponse[PlanRoutineDayResponse])
@limiter.limit("30/minute")
async def get_plan_day(
    request: Request,
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

    return {"data": response.data[0]}


@router.put("/workout-plans/{plan_id}/days/{plan_day_id}", response_model=DataResponse[PlanRoutineDayResponse])
@limiter.limit("15/minute")
async def update_plan_day(
    request: Request,
    plan_id: int,
    plan_day_id: int,
    updated_day: PlanRoutineDayUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    verify_plan_day_ownership(plan_day_id, user_id)

    update_data = updated_day.model_dump(exclude_unset=True)

    if "routine_id" in update_data:
        verify_routine_belongs_to_user(update_data["routine_id"], user_id)

    response = (
        supabase.table("plan_routine_days")
        .update(update_data)
        .eq("id", plan_day_id)
        .eq("plan_id", plan_id)
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/workout-plans/{plan_id}/days/{plan_day_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_plan_day(
    request: Request,
    plan_id: int,
    plan_day_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_plan_ownership(plan_id, user_id)
    verify_plan_day_ownership(plan_day_id, user_id)

    supabase.table("plan_routine_days").delete().eq("id", plan_day_id).eq("plan_id", plan_id).execute()
    return Response(status_code=204)
