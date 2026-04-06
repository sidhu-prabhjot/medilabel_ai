from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.schemas.workout_record import WorkoutRecordCreate, WorkoutRecordUpdate, WorkoutResponse
from api.schemas.workout_exercise_record import WorkoutExerciseRecordCreate, WorkoutExerciseRecordUpdate, WorkoutExerciseResponse
from api.schemas.set_record import SetRecordCreate, SetRecordUpdate, SetResponse
from api.schemas.common import DataResponse
from api.auth.auth import get_current_user
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Workouts"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def convert_decimals_to_float(data: dict) -> dict:
    for key, value in data.items():
        if isinstance(value, Decimal):
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

    if str(user_id) != result.data[0]["user_id"]:
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

    workout = result.data[0]["workouts"]
    workout_user_id = workout[0]["user_id"] if isinstance(workout, list) else workout["user_id"]
    if str(user_id) != workout_user_id:
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

    we = result.data[0]["workout_exercises"]
    we = we[0] if isinstance(we, list) else we
    workout = we["workouts"]
    workout_user_id = workout[0]["user_id"] if isinstance(workout, list) else workout["user_id"]
    if str(user_id) != workout_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")


# ------------------------------------------------------------------
# Workout routes
# ------------------------------------------------------------------

@router.post("/workouts", response_model=DataResponse[WorkoutResponse], status_code=201)
@limiter.limit("15/minute")
async def add_new_workout(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/workouts", response_model=DataResponse[list[WorkoutResponse]])
@limiter.limit("30/minute")
async def get_all_user_workouts(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("workouts")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.get("/workouts/{workout_id}", response_model=DataResponse[WorkoutResponse])
@limiter.limit("30/minute")
async def get_workout_by_id(
    request: Request,
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
    return {"data": response.data[0]}


@router.put("/workouts/{workout_id}", response_model=DataResponse[WorkoutResponse])
@limiter.limit("15/minute")
async def update_workout(
    request: Request,
    workout_id: int,
    updated_record: WorkoutRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("workouts")
        .update(update_data)
        .eq("id", workout_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/workouts/{workout_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_workout(
    request: Request,
    workout_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_ownership(workout_id, user_id)
    supabase.table("workouts").delete().eq("id", workout_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Workout exercise routes
# ------------------------------------------------------------------

@router.post("/workouts/{workout_id}/exercises", response_model=DataResponse[WorkoutExerciseResponse], status_code=201)
@limiter.limit("15/minute")
async def add_exercise_to_workout(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/workouts/{workout_id}/exercises", response_model=DataResponse[list[WorkoutExerciseResponse]])
@limiter.limit("30/minute")
async def get_exercises_in_workout(
    request: Request,
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
    return {"data": response.data}


@router.put("/workout-exercises/{workout_exercise_id}", response_model=DataResponse[WorkoutExerciseResponse])
@limiter.limit("15/minute")
async def update_workout_exercise(
    request: Request,
    workout_exercise_id: int,
    updated_data: WorkoutExerciseRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)

    update_payload = updated_data.model_dump(exclude_unset=True)
    response = (
        supabase.table("workout_exercises")
        .update(update_payload)
        .eq("id", workout_exercise_id)
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/workout-exercises/{workout_exercise_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_exercise_from_workout(
    request: Request,
    workout_exercise_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_workout_exercise_ownership(workout_exercise_id, user_id)
    supabase.table("workout_exercises").delete().eq("id", workout_exercise_id).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Set routes
# ------------------------------------------------------------------

@router.post("/workout-exercises/{workout_exercise_id}/sets", response_model=DataResponse[SetResponse], status_code=201)
@limiter.limit("15/minute")
async def add_set_to_workout_exercise(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/workout-exercises/{workout_exercise_id}/sets", response_model=DataResponse[list[SetResponse]])
@limiter.limit("30/minute")
async def get_sets_for_workout_exercise(
    request: Request,
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
    return {"data": response.data}


@router.put("/sets/{set_id}", response_model=DataResponse[SetResponse])
@limiter.limit("15/minute")
async def update_set(
    request: Request,
    set_id: int,
    updated_record: SetRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_set_ownership(set_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)
    update_data = convert_decimals_to_float(update_data)

    response = supabase.table("sets").update(update_data).eq("id", set_id).execute()
    return {"data": response.data[0]}


@router.delete("/sets/{set_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_set(
    request: Request,
    set_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_set_ownership(set_id, user_id)
    supabase.table("sets").delete().eq("id", set_id).execute()
    return Response(status_code=204)
