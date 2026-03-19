from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.exercise_record import ExerciseRecordCreate

router = APIRouter(prefix="/api")


# ------------------------------------------------------------------
# Exercise routes
# ------------------------------------------------------------------

@router.post("/exercises")
async def create_exercise(
    exercise_record: ExerciseRecordCreate,
    _: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("exercises")
        .insert({
            "exercise_name": exercise_record.exercise_name,
            "muscle_group": exercise_record.muscle_group,
            "equipment": exercise_record.equipment,
        })
        .execute()
    )
    return {"success": True, "exercise": response.data}


@router.get("/exercises")
async def get_all_exercises(_: UUID = Depends(get_current_user)):
    response = supabase.table("exercises").select("*").execute()
    return {"success": True, "exercises": response.data}


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(
    exercise_id: int,
    _: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("exercises")
        .select("*")
        .eq("id", exercise_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Exercise not found")

    return {"success": True, "exercise": response.data[0]}