from datetime import datetime, date, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.schedule_record import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    IntakeLogCreate,
    IntakeLogResponse,
    TodayDoseItem,
)
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Schedules"])


def verify_schedule_ownership(schedule_id: int, user_id: UUID):
    result = (
        supabase.table("user_medication_schedule")
        .select("schedule_id, user_id")
        .eq("schedule_id", schedule_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/schedules", response_model=DataResponse[list[ScheduleResponse]])
@limiter.limit("30/minute")
async def get_schedules(request: Request, user_id: UUID = Depends(get_current_user)):
    schedules = (
        supabase.table("user_medication_schedule")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    ).data

    if not schedules:
        return {"data": []}

    medication_ids = list({s["medication_id"] for s in schedules}) #using list to make sure medication only gets added once (even if in multiple schedules)
    medications = (
        supabase.table("medications")
        .select("medication_id, name")
        .in_("medication_id", medication_ids)
        .execute()
    ).data
    medication_names = {m["medication_id"]: m["name"] for m in medications}

    stock_ids = [s["stock_id"] for s in schedules if s.get("stock_id")]
    stock_units = {}
    if stock_ids:
        stock_rows = (
            supabase.table("user_medication_stock")
            .select("stock_id, unit")
            .in_("stock_id", stock_ids)
            .execute()
        ).data
        stock_units = {s["stock_id"]: s["unit"] for s in stock_rows}

    result = []
    for s in schedules:
        result.append(ScheduleResponse(
            **s,
            medication_name=medication_names.get(s["medication_id"]),
            stock_unit=stock_units.get(s.get("stock_id")),
        ))

    return {"data": result}


@router.get("/schedules/today", response_model=DataResponse[list[TodayDoseItem]])
@limiter.limit("30/minute")
async def get_schedules_today(request: Request, user_id: UUID = Depends(get_current_user)):
    today = date.today().isoformat()
    now = datetime.now(timezone.utc)

    schedules = (
        supabase.table("user_medication_schedule")
        .select("*")
        .eq("user_id", str(user_id))
        .lte("start_date", today)
        .execute()
    ).data

    active_schedules = [
        s for s in schedules
        if s.get("end_date") is None or s["end_date"] >= today
    ]

    if not active_schedules:
        return {"data": []}

    medication_ids = list({s["medication_id"] for s in active_schedules})
    medications = (
        supabase.table("medications")
        .select("medication_id, name")
        .in_("medication_id", medication_ids)
        .execute()
    ).data
    medication_names = {m["medication_id"]: m["name"] for m in medications}

    stock_ids = [s["stock_id"] for s in active_schedules if s.get("stock_id")]
    stock_units = {}
    if stock_ids:
        stock_rows = (
            supabase.table("user_medication_stock")
            .select("stock_id, unit")
            .in_("stock_id", stock_ids)
            .execute()
        ).data
        stock_units = {s["stock_id"]: s["unit"] for s in stock_rows}

    schedule_ids = [s["schedule_id"] for s in active_schedules]
    logs = (
        supabase.table("user_medication_intake_logs")
        .select("*")
        .in_("schedule_id", schedule_ids)
        .eq("user_id", str(user_id))
        .gte("taken_at", today)
        .execute()
    ).data
    logs_by_schedule = {log["schedule_id"]: log for log in logs}

    items = []
    for s in active_schedules:
        log = logs_by_schedule.get(s["schedule_id"])
        next_dose_at = s.get("next_dose_at")

        is_overdue = (
            next_dose_at is not None
            and datetime.fromisoformat(next_dose_at) < now
            and (log is None or log["status"] != "taken")
        )

        items.append(TodayDoseItem(
            schedule_id=s["schedule_id"],
            medication_id=s["medication_id"],
            medication_name=medication_names.get(s["medication_id"], "Unknown"),
            frequency=s["frequency"],
            doses_per_day=s.get("doses_per_day"),
            next_dose_at=next_dose_at,
            doses_remaining=s.get("doses_remaining"),
            stock_unit=stock_units.get(s.get("stock_id")),
            log_id=log["log_id"] if log else None,
            status=log["status"] if log else "pending",
            taken_at=log.get("taken_at") if log else None,
            is_overdue=is_overdue,
        ))

    return {"data": items}


@router.get("/schedules/{schedule_id}", response_model=DataResponse[ScheduleResponse])
@limiter.limit("30/minute")
async def get_schedule(
    request: Request,
    schedule_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_schedule_ownership(schedule_id, user_id)

    response = (
        supabase.table("user_medication_schedule")
        .select("*")
        .eq("schedule_id", schedule_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.post("/schedules", response_model=DataResponse[ScheduleResponse], status_code=201)
@limiter.limit("15/minute")
async def create_schedule(
    request: Request,
    body: ScheduleCreate,
    user_id: UUID = Depends(get_current_user),
):
    medication = (
        supabase.table("medications")
        .select("medication_id")
        .eq("medication_id", body.medication_id)
        .execute()
    )
    if not medication.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    response = (
        supabase.table("user_medication_schedule")
        .insert({
            "user_id": str(user_id),
            "medication_id": body.medication_id,
            "stock_id": body.stock_id,
            "frequency": body.frequency,
            "interval_hours": body.interval_hours,
            "doses_per_day": body.doses_per_day,
            "start_date": body.start_date.isoformat(),
            "end_date": body.end_date.isoformat() if body.end_date else None,
            "doses_remaining": body.doses_remaining,
            "next_dose_at": body.next_dose_at.isoformat() if body.next_dose_at else None,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.put("/schedules/{schedule_id}", response_model=DataResponse[ScheduleResponse])
@limiter.limit("15/minute")
async def update_schedule(
    request: Request,
    schedule_id: int,
    body: ScheduleUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_schedule_ownership(schedule_id, user_id)

    update_data = body.model_dump(exclude_unset=True)

    if "start_date" in update_data and update_data["start_date"]:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data and update_data["end_date"]:
        update_data["end_date"] = update_data["end_date"].isoformat()
    if "next_dose_at" in update_data and update_data["next_dose_at"]:
        update_data["next_dose_at"] = update_data["next_dose_at"].isoformat()

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("user_medication_schedule")
        .update(update_data)
        .eq("schedule_id", schedule_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/schedules/{schedule_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_schedule(
    request: Request,
    schedule_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_schedule_ownership(schedule_id, user_id)

    supabase.table("user_medication_schedule").delete().eq("schedule_id", schedule_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


@router.post("/schedules/{schedule_id}/log", response_model=DataResponse[IntakeLogResponse], status_code=201)
@limiter.limit("30/minute")
async def log_dose(
    request: Request,
    schedule_id: int,
    body: IntakeLogCreate,
    user_id: UUID = Depends(get_current_user),
):
    verify_schedule_ownership(schedule_id, user_id)

    schedule = (
        supabase.table("user_medication_schedule")
        .select("medication_id, doses_remaining, stock_id")
        .eq("schedule_id", schedule_id)
        .execute()
    ).data[0]

    taken_at = body.taken_at or datetime.now(timezone.utc)

    response = (
        supabase.table("user_medication_intake_logs")
        .insert({
            "schedule_id": schedule_id,
            "user_id": str(user_id),
            "medication_id": schedule["medication_id"],
            "status": body.status,
            "taken_at": taken_at.isoformat(),
            "notes": body.notes,
        })
        .execute()
    )

    if body.status == "taken" and schedule.get("doses_remaining") is not None:
        new_count = max(0, schedule["doses_remaining"] - 1) #prevents going negative
        supabase.table("user_medication_schedule").update({"doses_remaining": new_count}).eq("schedule_id", schedule_id).execute()

    return {"data": response.data[0]}
