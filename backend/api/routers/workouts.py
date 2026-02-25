from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from backend.api.db.supabase import supabase
from backend.api.schemas.workout_record import WorkoutRecordCreate, WorkoutRecordUpdate
from backend.api.schemas.workout_exercise_record import WorkoutExerciseRecordCreate, WorkoutExerciseRecordUpdate
from backend.api.schemas.set_record import SetRecordCreate, SetRecordUpdate
from backend.api.auth.auth import get_current_user

router = APIRouter(prefix="/api")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def convert_decimals_to_float(data: dict) -> dict:
    for key, value in data.items():
        if type(value) is Decimal:
            data[key] = float(value)
    return data


def verify_workout_ownership(workout_id: int, user_id: UUID):
    result = (
        supabase.table("workouts")
        .select("id, user_id")
        .eq("id", workout_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Workout not found")

    workout_owner_id = result.data[0]["user_id"]

    if str(user_id) != workout_owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_workout_exercise_ownership(workout_exercise_id: int, user_id: UUID):
    result = (
        supabase.table("workout_exercises")
        .select("""
            id,
            workout_id,
            workouts (
                id,
                user_id
            )
        """)
        .eq("id", workout_exercise_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Workout exercise not found")

    workout_owner_id = result.data[0]["workouts"][0]["user_id"]

    if str(user_id) != workout_owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_set_ownership(set_id: int, user_id: UUID):
    result = (
        supabase.table("sets")
        .select("""
            id,
            workout_exercise_id,
            workout_exercises (
                workout_id,
                workouts (
                    user_id
                )
            )
        """)
        .eq("id", set_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Set not found")

    workout_owner_id = result.data[0]["workout_exercises"][0]["workouts"][0]["user_id"]

    if str(user_id) != workout_owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")


# ------------------------------------------------------------------
# Workout routes
# ------------------------------------------------------------------

@router.post("/workouts")
async def add_new_workout(
    workout_record: WorkoutRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("workouts")
        .insert({
            "user_id": str(user_id),
            "workout_name": workout_record.workout_name,
            "workout_date": workout_record.workout_date.isoformat(),
            "duration_minutes": workout_record.duration_minutes,
            "notes": workout_record.notes,
        })
        .execute()
    )
    return {"success": True, "workout": response.data}


@router.get("/workouts")
async def get_all_user_workouts(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("workouts")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "workouts": response.data}


@router.get("/workouts/{workout_id}")
async def get_workout_by_id(
    workout_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)
    response = (
        supabase.table("workouts")
        .select("*")
        .eq("id", workout_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "workout": response.data}


@router.put("/workouts/{workout_id}")
async def update_workout(
    workout_id: int,
    updated_record: WorkoutRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)

    update_data = updated_record.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("workouts")
        .update(update_data)
        .eq("id", workout_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "updated_workout": response.data}


@router.delete("/workouts/{workout_id}")
async def delete_workout(
    workout_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)
    supabase.table("workouts").delete().eq("id", workout_id).eq("user_id", str(user_id)).execute()
    return {"success": True}


# ------------------------------------------------------------------
# Workout exercise routes
# ------------------------------------------------------------------

@router.post("/workouts/{workout_id}/exercises")
async def add_exercise_to_workout(
    workout_id: int,
    workout_exercise_record: WorkoutExerciseRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)
    response = (
        supabase.table("workout_exercises")
        .insert({
            "workout_id": workout_id,
            "exercise_id": workout_exercise_record.exercise_id,
            "order_index": workout_exercise_record.order_index,
        })
        .execute()
    )
    return {"success": True, "exercise": response.data}


@router.get("/workouts/{workout_id}/exercises")
async def get_exercises_in_workout(
    workout_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)
    response = (
        supabase.table("workout_exercises")
        .select("*")
        .eq("workout_id", workout_id)
        .execute()
    )
    return {"success": True, "exercises": response.data}


@router.put("/workout-exercises/{workout_exercise_id}")
async def update_workout_exercise(
    workout_exercise_id: int,
    updated_data: WorkoutExerciseRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)

    update_payload = updated_data.dict(exclude_unset=True)
    response = (
        supabase.table("workout_exercises")
        .update(update_payload)
        .eq("id", workout_exercise_id)
        .execute()
    )
    return {"success": True, "updated_exercise": response.data}


@router.delete("/workout-exercises/{workout_exercise_id}")
async def delete_exercise_from_workout(
    workout_exercise_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)
    supabase.table("workout_exercises").delete().eq("id", workout_exercise_id).execute()
    return {"success": True}


# ------------------------------------------------------------------
# Set routes
# ------------------------------------------------------------------

@router.post("/workout-exercises/{workout_exercise_id}/sets")
async def add_set_to_workout_exercise(
    workout_exercise_id: int,
    set_record: SetRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)
    response = (
        supabase.table("sets")
        .insert({
            "workout_exercise_id": workout_exercise_id,
            "reps": set_record.reps,
            "weight_kg": float(set_record.weight_kg) if set_record.weight_kg is not None else None,
            "rest_seconds": set_record.rest_seconds,
            "rpe": float(set_record.rpe) if set_record.rpe is not None else None,
        })
        .execute()
    )
    return {"success": True, "set": response.data}


@router.get("/workout-exercises/{workout_exercise_id}/sets")
async def get_sets_for_workout_exercise(
    workout_exercise_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)
    response = (
        supabase.table("sets")
        .select("*")
        .eq("workout_exercise_id", workout_exercise_id)
        .execute()
    )
    return {"success": True, "sets": response.data}


@router.put("/sets/{set_id}")
async def update_set(
    set_id: int,
    updated_record: SetRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_set_ownership(set_id, user_id)

    update_data = updated_record.dict(exclude_unset=True)
    update_data = convert_decimals_to_float(update_data)

    response = supabase.table("sets").update(update_data).eq("id", set_id).execute()
    return {"success": True, "updated_set": response.data}


@router.delete("/sets/{set_id}")
async def delete_set(
    set_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_set_ownership(set_id, user_id)
    supabase.table("sets").delete().eq("id", set_id).execute()
    return {"success": True}