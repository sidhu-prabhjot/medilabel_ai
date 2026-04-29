from datetime import datetime, date, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.supplement_record import (
    SupplementCreate,
    SupplementUpdate,
    SupplementResponse,
    SupplementLogResponse,
    SupplementTodayItem,
)
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Supplements"])


def verify_supplement_ownership(supplement_id: int, user_id: UUID):
    result = (
        supabase.table("user_supplements")
        .select("supplement_id, user_id")
        .eq("supplement_id", supplement_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Supplement not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/supplements", response_model=DataResponse[list[SupplementResponse]])
@limiter.limit("30/minute")
async def get_supplements(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("user_supplements")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.get("/supplements/today", response_model=DataResponse[list[SupplementTodayItem]])
@limiter.limit("30/minute")
async def get_supplements_today(request: Request, user_id: UUID = Depends(get_current_user)):
    today = date.today().isoformat()

    supplements = (
        supabase.table("user_supplements")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    ).data

    logs = (
        supabase.table("user_supplement_logs")
        .select("*")
        .eq("user_id", str(user_id))
        .eq("log_date", today)
        .execute()
    ).data

    logs_by_supplement = {log["supplement_id"]: log for log in logs}

    items = []
    for supplement in supplements:
        log = logs_by_supplement.get(supplement["supplement_id"])
        items.append(
            SupplementTodayItem(
                supplement_id=supplement["supplement_id"],
                name=supplement["name"],
                brand=supplement.get("brand"),
                form=supplement.get("form"),
                dosage_amount=supplement.get("dosage_amount"),
                dosage_unit=supplement.get("dosage_unit"),
                log_date=date.today(),
                status=log["status"] if log else "pending",
                taken_at=log["taken_at"] if log else None,
                log_id=log["log_id"] if log else None,
            )
        )

    return {"data": items}


@router.get("/supplements/{supplement_id}", response_model=DataResponse[SupplementResponse])
@limiter.limit("30/minute")
async def get_supplement(
    request: Request,
    supplement_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_supplement_ownership(supplement_id, user_id)

    response = (
        supabase.table("user_supplements")
        .select("*")
        .eq("supplement_id", supplement_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.post("/supplements", response_model=DataResponse[SupplementResponse], status_code=201)
@limiter.limit("15/minute")
async def create_supplement(
    request: Request,
    body: SupplementCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("user_supplements")
        .insert({
            "user_id": str(user_id),
            "name": body.name,
            "brand": body.brand,
            "form": body.form,
            "dosage_amount": body.dosage_amount,
            "dosage_unit": body.dosage_unit,
            "notes": body.notes,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.put("/supplements/{supplement_id}", response_model=DataResponse[SupplementResponse])
@limiter.limit("15/minute")
async def update_supplement(
    request: Request,
    supplement_id: int,
    body: SupplementUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_supplement_ownership(supplement_id, user_id)

    update_data = body.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("user_supplements")
        .update(update_data)
        .eq("supplement_id", supplement_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/supplements/{supplement_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_supplement(
    request: Request,
    supplement_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_supplement_ownership(supplement_id, user_id)

    supabase.table("user_supplements").delete().eq("supplement_id", supplement_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


@router.post("/supplements/{supplement_id}/log", response_model=DataResponse[SupplementLogResponse])
@limiter.limit("30/minute")
async def toggle_supplement_log(
    request: Request,
    supplement_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_supplement_ownership(supplement_id, user_id)

    today = date.today().isoformat()

    existing_log = (
        supabase.table("user_supplement_logs")
        .select("*")
        .eq("supplement_id", supplement_id)
        .eq("user_id", str(user_id))
        .eq("log_date", today)
        .execute()
    ).data

    if existing_log and existing_log[0]["status"] == "taken":
        supabase.table("user_supplement_logs").delete().eq("log_id", existing_log[0]["log_id"]).execute()
        return {"data": {"supplement_id": supplement_id, "log_date": today, "status": "pending"}}

    response = (
        supabase.table("user_supplement_logs")
        .upsert({
            "supplement_id": supplement_id,
            "user_id": str(user_id),
            "log_date": today,
            "status": "taken",
            "taken_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="supplement_id,log_date")
        .execute()
    )
    return {"data": response.data[0]}
