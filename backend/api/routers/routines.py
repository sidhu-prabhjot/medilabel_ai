from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.workout_routine_record import WorkoutRoutineCreate, WorkoutRoutineUpdate, WorkoutRoutineResponse
from api.schemas.routine_exercise_record import RoutineExerciseRecordCreate, RoutineExerciseRecordUpdate, RoutineExerciseResponse
from api.schemas.routine_set_record import RoutineSetRecordCreate, RoutineSetRecordUpdate, RoutineSetResponse
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Routines"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def verify_routine_ownership(routine_id: int, user_id: UUID):
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


def verify_routine_exercise_ownership(routine_exercise_id: int, user_id: UUID):
    result = (
        supabase.table("routine_exercises")
        .select("""
            id,
            routine_id,
            workout_routines (
                id,
                user_id
            )
        """)
        .eq("id", routine_exercise_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Routine exercise not found")

    if result.data[0]["workout_routines"]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_routine_set_ownership(set_id: int, user_id: UUID):
    result = (
        supabase.table("routine_sets")
        .select("""
            id,
            routine_exercise_id,
            routine_exercises (
                routine_id,
                workout_routines (
                    user_id
                )
            )
        """)
        .eq("id", set_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Routine set not found")

    if result.data[0]["routine_exercises"]["workout_routines"]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def convert_decimals_to_float(data: dict) -> dict:
    for key, value in data.items():
        if isinstance(value, Decimal):
            data[key] = float(value)
    return data


# ------------------------------------------------------------------
# Workout routine routes
# ------------------------------------------------------------------

@router.post("/workout-routines", response_model=DataResponse[WorkoutRoutineResponse], status_code=201)
@limiter.limit("15/minute")
async def create_workout_routine(
    request: Request,
    workout_routine_record: WorkoutRoutineCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("workout_routines")
        .insert({
            "user_id": str(user_id),
            "routine_name": workout_routine_record.routine_name,
            "description": workout_routine_record.description,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.get("/workout-routines", response_model=DataResponse[list[WorkoutRoutineResponse]])
@limiter.limit("30/minute")
async def get_all_workout_routines(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("workout_routines")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.put("/workout-routines/{routine_id}", response_model=DataResponse[WorkoutRoutineResponse])
@limiter.limit("15/minute")
async def update_workout_routine(
    request: Request,
    routine_id: int,
    updated_record: WorkoutRoutineUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_ownership(routine_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)

    response = (
        supabase.table("workout_routines")
        .update(update_data)
        .eq("id", routine_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/workout-routines/{routine_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_workout_routine(
    request: Request,
    routine_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_ownership(routine_id, user_id)
    supabase.table("workout_routines").delete().eq("id", routine_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Routine exercise routes
# ------------------------------------------------------------------

@router.post("/workout-routines/{routine_id}/exercises", response_model=DataResponse[RoutineExerciseResponse], status_code=201)
@limiter.limit("15/minute")
async def add_exercise_to_routine(
    request: Request,
    routine_id: int,
    routine_exercise_record: RoutineExerciseRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_ownership(routine_id, user_id)

    response = (
        supabase.table("routine_exercises")
        .insert({
            "routine_id": routine_id,
            "exercise_id": routine_exercise_record.exercise_id,
            "order_index": routine_exercise_record.order_index,
            "notes": routine_exercise_record.notes,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.get("/workout-routines/{routine_id}/exercises", response_model=DataResponse[list[RoutineExerciseResponse]])
@limiter.limit("30/minute")
async def get_exercises_in_routine(
    request: Request,
    routine_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_ownership(routine_id, user_id)

    response = (
        supabase.table("routine_exercises")
        .select("*")
        .eq("routine_id", routine_id)
        .order("order_index", desc=False)
        .execute()
    )
    return {"data": response.data}


@router.put("/routine-exercises/{routine_exercise_id}", response_model=DataResponse[RoutineExerciseResponse])
@limiter.limit("15/minute")
async def update_routine_exercise(
    request: Request,
    routine_exercise_id: int,
    updated_record: RoutineExerciseRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_exercise_ownership(routine_exercise_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)

    response = (
        supabase.table("routine_exercises")
        .update(update_data)
        .eq("id", routine_exercise_id)
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/routine-exercises/{routine_exercise_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_routine_exercise(
    request: Request,
    routine_exercise_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_exercise_ownership(routine_exercise_id, user_id)
    supabase.table("routine_exercises").delete().eq("id", routine_exercise_id).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Routine set routes
# ------------------------------------------------------------------

@router.post("/routine-exercises/{routine_exercise_id}/sets", response_model=DataResponse[RoutineSetResponse], status_code=201)
@limiter.limit("15/minute")
async def add_set_to_routine_exercise(
    request: Request,
    routine_exercise_id: int,
    routine_set_record: RoutineSetRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_exercise_ownership(routine_exercise_id, user_id)

    response = (
        supabase.table("routine_sets")
        .insert({
            "routine_exercise_id": routine_exercise_id,
            "target_reps": routine_set_record.target_reps,
            "target_weight": float(routine_set_record.target_weight) if routine_set_record.target_weight else None,
            "target_rpe": float(routine_set_record.target_rpe) if routine_set_record.target_rpe else None,
            "rest_seconds": int(routine_set_record.rest_seconds) if routine_set_record.rest_seconds else None,
            "set_order": routine_set_record.set_order,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.get("/routine-exercises/{routine_exercise_id}/sets", response_model=DataResponse[list[RoutineSetResponse]])
@limiter.limit("30/minute")
async def get_sets_in_routine_exercise(
    request: Request,
    routine_exercise_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_exercise_ownership(routine_exercise_id, user_id)

    response = (
        supabase.table("routine_sets")
        .select("*")
        .eq("routine_exercise_id", routine_exercise_id)
        .execute()
    )
    return {"data": response.data}


@router.get("/routine-sets/{set_id}", response_model=DataResponse[RoutineSetResponse])
@limiter.limit("30/minute")
async def get_routine_set_by_id(
    request: Request,
    set_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_set_ownership(set_id, user_id)

    response = (
        supabase.table("routine_sets")
        .select("*")
        .eq("id", set_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Routine set not found")

    return {"data": response.data[0]}


@router.put("/routine-sets/{set_id}", response_model=DataResponse[RoutineSetResponse])
@limiter.limit("15/minute")
async def update_routine_set(
    request: Request,
    set_id: int,
    updated_record: RoutineSetRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_set_ownership(set_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)
    update_data = convert_decimals_to_float(update_data)

    response = (
        supabase.table("routine_sets")
        .update(update_data)
        .eq("id", set_id)
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/routine-sets/{set_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_routine_set(
    request: Request,
    set_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_routine_set_ownership(set_id, user_id)
    supabase.table("routine_sets").delete().eq("id", set_id).execute()
    return Response(status_code=204)
