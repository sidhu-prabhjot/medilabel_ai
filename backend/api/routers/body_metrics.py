from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from backend.api.db.supabase import supabase
from backend.api.auth.auth import get_current_user
from backend.api.schemas.body_metric_record import BodyMetricRecordCreate, BodyMetricRecordUpdate

router = APIRouter(prefix="/api")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def verify_metric_ownership(metric_id: int, user_id: UUID):
    result = (
        supabase.table("body_metrics")
        .select("id, user_id")
        .eq("id", metric_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Body metric entry not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def convert_decimals_to_float(data: dict) -> dict:
    for key, value in data.items():
        if type(value) is Decimal:
            data[key] = float(value)
    return data


# ------------------------------------------------------------------
# Body metric routes
# ------------------------------------------------------------------

@router.post("/body-metrics")
async def add_body_metric(
    body_metric_record: BodyMetricRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("body_metrics")
        .insert({
            "user_id": str(user_id),
            "weight_kg": float(body_metric_record.weight_kg),
            "body_fat_percent": float(body_metric_record.body_fat_percent) if body_metric_record.body_fat_percent else None,
            "recorded_at": body_metric_record.recorded_at.isoformat(),
            "notes": body_metric_record.notes,
        })
        .execute()
    )
    return {"success": True, "body_metric": response.data}


@router.get("/body-metrics")
async def get_all_body_metrics(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("body_metrics")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "body_metrics": response.data}


@router.get("/body-metrics/latest")
async def get_latest_body_metric(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("body_metrics")
        .select("*")
        .eq("user_id", str(user_id))
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No body metric entries found")

    return {"success": True, "body_metric": response.data[0]}


@router.put("/body-metrics/{metric_id}")
async def update_body_metric(
    metric_id: int,
    updated_record: BodyMetricRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_metric_ownership(metric_id, user_id)

    update_data = updated_record.dict(exclude_unset=True)
    update_data = convert_decimals_to_float(update_data)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("body_metrics")
        .update(update_data)
        .eq("id", metric_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "updated_body_metric": response.data}


@router.delete("/body-metrics/{metric_id}")
async def delete_body_metric(
    metric_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_metric_ownership(metric_id, user_id)
    supabase.table("body_metrics").delete().eq("id", metric_id).eq("user_id", str(user_id)).execute()
    return {"success": True}