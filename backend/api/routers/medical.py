from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.symptom_logs import SymptomLogCreate, SymptomLogUpdate, SymptomLogResponse
from api.schemas.medication_record import MedicationRecordCreate, MedicationResponse
from api.schemas.stock_record import StockRecordCreate, StockRecordResponse
from api.schemas.common import DataResponse
from api.limiter import limiter

router = APIRouter(prefix="/api", tags=["Medical"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def verify_symptom_ownership(symptom_id: str, user_id: UUID):
    result = (
        supabase.table("symptom_logs")
        .select("symptom_id, user_id")
        .eq("symptom_id", symptom_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Symptom log not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


def verify_stock_ownership(stock_id: int, user_id: UUID):
    result = (
        supabase.table("user_medication_stock")
        .select("stock_id, user_id")
        .eq("stock_id", stock_id)
        .eq("user_id", str(user_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Medication stock entry not found")

    if result.data[0]["user_id"] != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized")


# ------------------------------------------------------------------
# Symptom routes
# ------------------------------------------------------------------

@router.get("/symptoms", response_model=DataResponse[list[SymptomLogResponse]])
@limiter.limit("30/minute")
async def get_symptom_logs(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("symptom_logs")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.post("/symptoms", response_model=DataResponse[SymptomLogResponse], status_code=201)
@limiter.limit("15/minute")
async def add_symptom_log(
    request: Request,
    symptom_log: SymptomLogCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("symptom_logs")
        .insert({
            "user_id": str(user_id),
            "symptom": symptom_log.symptom,
            "severity": symptom_log.severity,
            "notes": symptom_log.notes,
            "is_resolved": symptom_log.is_resolved,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.put("/symptoms/{symptom_id}", response_model=DataResponse[SymptomLogResponse])
@limiter.limit("15/minute")
async def update_symptom_log(
    request: Request,
    symptom_id: str,
    symptom_log_update: SymptomLogUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_symptom_ownership(symptom_id, user_id)

    update_data = symptom_log_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("symptom_logs")
        .update(update_data)
        .eq("symptom_id", symptom_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}


@router.delete("/symptoms/{symptom_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_symptom_log(
    request: Request,
    symptom_id: str,
    user_id: UUID = Depends(get_current_user),
):
    verify_symptom_ownership(symptom_id, user_id)
    supabase.table("symptom_logs").delete().eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)


# ------------------------------------------------------------------
# Medication routes
# ------------------------------------------------------------------

@router.get("/medications/search")
@limiter.limit("5/minute")
async def search_medications(
    request: Request,
    medication_term: str = Query(..., max_length=100),
    _: UUID = Depends(get_current_user),
):
    try:
        async with httpx.AsyncClient() as client:
            id_search_response = await client.get(
                "https://rxnav.nlm.nih.gov/REST/rxcui.json",
                params={"name": medication_term, "search": 9, "allsrc": 0},
                timeout=5,
            )
            id_search_response.raise_for_status()

            id_array = id_search_response.json().get("idGroup", {}).get("rxnormId")
            if not id_array:
                return {"data": []}

            db_response = supabase.table("medications").select("*").in_("rxcui", id_array).execute()
            if db_response.data:
                return {"data": db_response.data}

            data = []
            for rxcui_id in id_array:
                properties_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui_id}/properties.json"
                properties_response = await client.get(properties_url, timeout=5)
                properties_response.raise_for_status()
                data.append(properties_response.json())

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Medication search timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Upstream API error: {e.response.status_code}")

    return {"data": data}


@router.get("/medications/{medication_id}", response_model=DataResponse[MedicationResponse])
@limiter.limit("30/minute")
async def get_medication(
    request: Request,
    medication_id: int,
    _: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("medications")
        .select("*")
        .eq("medication_id", medication_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    return {"data": response.data[0]}


@router.post("/medications", response_model=DataResponse[MedicationResponse], status_code=201)
@limiter.limit("15/minute")
async def add_medication(
    request: Request,
    medication_record: MedicationRecordCreate,
    _: UUID = Depends(get_current_user),
):
    if medication_record.tty.lower() not in ("bn", "sbd", "scd"):
        raise HTTPException(status_code=400, detail=f"Unsupported term type (TTY): {medication_record.tty}")

    response = (
        supabase.table("medications")
        .insert({
            "rxcui": medication_record.rxcui,
            "name": medication_record.name,
            "generic_rxcui": None,
            "is_brand": medication_record.tty.lower() != "scd",
        })
        .execute()
    )
    return {"data": response.data[0]}



# ------------------------------------------------------------------
# Medication stock routes
# ------------------------------------------------------------------

@router.post("/medications/{medication_id}/stock", response_model=DataResponse[StockRecordResponse], status_code=201)
@limiter.limit("15/minute")
async def add_medication_to_stock(
    request: Request,
    medication_id: int,
    stock_record: StockRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    #check existence of medication first
    medication = supabase.table("medications").select("medication_id").eq("medication_id", medication_id).execute()
    if not medication.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    response = (
        supabase.table("user_medication_stock")
        .insert({
            "user_id": str(user_id),
            "medication_id": medication_id,
            "quantity": stock_record.quantity,
            "unit": stock_record.unit,
            "expiration_date": stock_record.expiration_date.isoformat() if stock_record.expiration_date else None,
            "opened_at": stock_record.opened_at.isoformat() if stock_record.opened_at else None,
            "notes": stock_record.notes,
        })
        .execute()
    )
    return {"data": response.data[0]}


@router.get("/user/medications", response_model=DataResponse[list[StockRecordResponse]])
@limiter.limit("30/minute")
async def get_all_user_medications(request: Request, user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("user_medication_stock")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data}


@router.get("/medications/stock/{stock_id}", response_model=DataResponse[StockRecordResponse])
@limiter.limit("30/minute")
async def get_user_medication_stock(
    request: Request,
    stock_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_stock_ownership(stock_id, user_id)

    response = (
        supabase.table("user_medication_stock")
        .select("*")
        .eq("stock_id", stock_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"data": response.data[0]}

@router.delete("/medications/{medication_id}/stock/{stock_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_user_medication_stock(
    request: Request,
    medication_id: int,
    stock_id: int,
    user_id: UUID = Depends(get_current_user),
):
    verify_stock_ownership(stock_id, user_id)

    supabase.table("user_medication_stock").delete().eq("medication_id", medication_id).eq("stock_id", stock_id).eq("user_id", str(user_id)).execute()
    return Response(status_code=204)