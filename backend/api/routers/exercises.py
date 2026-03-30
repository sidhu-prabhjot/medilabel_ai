from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.exercise_record import ExerciseRecordCreate, ExerciseResponse
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Exercises"])


# ------------------------------------------------------------------
# Exercise routes
# ------------------------------------------------------------------

@router.post("/exercises", response_model=DataResponse[ExerciseResponse], status_code=201)
@limiter.limit("15/minute")
async def create_exercise(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/exercises", response_model=DataResponse[list[ExerciseResponse]])
@limiter.limit("30/minute")
async def get_all_exercises(request: Request, _: UUID = Depends(get_current_user)):
    response = supabase.table("exercises").select("*").execute()
    return {"data": response.data}


@router.get("/exercises/{exercise_id}", response_model=DataResponse[ExerciseResponse])
@limiter.limit("30/minute")
async def get_exercise_by_id(
    request: Request,
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

    return {"data": response.data[0]}
