from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.body_metric_record import BodyMetricRecordCreate, BodyMetricRecordUpdate, BodyMetricResponse
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Body Metrics"])


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
        if isinstance(value, Decimal):
            data[key] = float(value)
    return data


# ------------------------------------------------------------------
# Body metric routes
# ------------------------------------------------------------------

@router.post("/body-metrics", response_model=DataResponse[BodyMetricResponse], status_code=201)
@limiter.limit("15/minute")
async def add_body_metric(
    request: Request,
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
    return {"data": response.data[0]}


@router.get("/body-metrics", response_model=DataResponse[list[BodyMetricResponse]])
@limiter.limit("30/minute")
async def get_all_body_metrics(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("body_metrics")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.get("/body-metrics/latest", response_model=DataResponse[BodyMetricResponse])
@limiter.limit("30/minute")
async def get_latest_body_metric(request: Request, user_id: UUID = Depends(get_current_user)):
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

    return {"data": response.data[0]}


@router.put("/body-metrics/{metric_id}", response_model=DataResponse[BodyMetricResponse])
@limiter.limit("15/minute")
async def update_body_metric(
    request: Request,
    metric_id: int,
    updated_record: BodyMetricRecordUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_metric_ownership(metric_id, user_id)

    update_data = updated_record.model_dump(exclude_unset=True)
    update_data = convert_decimals_to_float(update_data)
    if "recorded_at" in update_data:
        update_data["recorded_at"] = update_data["recorded_at"].isoformat()

    response = (
        supabase.table("body_metrics")
        .update(update_data)
        .eq("id", metric_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/body-metrics/{metric_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_body_metric(
    request: Request,
    metric_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_metric_ownership(metric_id, user_id)
    supabase.table("body_metrics").delete().eq("id", metric_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)
