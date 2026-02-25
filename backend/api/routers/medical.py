from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from backend.api.db.supabase import supabase
from backend.api.auth.auth import get_current_user
from backend.api.schemas.symptom_logs import SymptomLogCreate, SymptomLogUpdate
from backend.api.schemas.medication_record import MedicationRecordCreate, MedicationRecordUpdate
from backend.api.schemas.stock_record import StockRecordCreate

router = APIRouter(prefix="/api")


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

@router.get("/symptoms")
async def get_symptom_logs(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("symptom_logs")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "symptom_logs": response.data}


@router.post("/symptoms")
async def add_symptom_log(
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
    return {"success": True, "symptom_log": response.data}


@router.put("/symptoms/{symptom_id}")
async def update_symptom_log(
    symptom_id: str,
    symptom_log_update: SymptomLogUpdate,
    user_id: UUID = Depends(get_current_user),
):
    verify_symptom_ownership(symptom_id, user_id)

    update_data = symptom_log_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("symptom_logs")
        .update(update_data)
        .eq("symptom_id", symptom_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "updated_symptom_log": response.data}


@router.delete("/symptoms/{symptom_id}")
async def delete_symptom_log(
    symptom_id: str,
    user_id: UUID = Depends(get_current_user),
):
    verify_symptom_ownership(symptom_id, user_id)
    supabase.table("symptom_logs").delete().eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()
    return {"success": True}


# ------------------------------------------------------------------
# Medication routes
# ------------------------------------------------------------------

@router.get("/medications/search")
async def search_medications(medication_term: str):
    async with httpx.AsyncClient() as client:
        id_search_url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={medication_term}&search=9&allsrc=0"
        id_search_response = await client.get(id_search_url, timeout=5)
        id_search_response.raise_for_status()

        id_array = id_search_response.json()["idGroup"]["rxnormId"]

        db_response = supabase.table("medications").select("*").in_("rxcui", id_array).execute()
        if db_response.data:
            return {"success": True, "medications": db_response.data}

        data = []
        for rxcui_id in id_array:
            properties_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui_id}/properties.json"
            properties_response = await client.get(properties_url, timeout=5)
            properties_response.raise_for_status()
            data.append(properties_response.json())

    return {"success": True, "medications": data}


@router.get("/medications/{medication_id}")
async def get_medication(medication_id: int):
    response = (
        supabase.table("medications")
        .select("*")
        .eq("medication_id", medication_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    return {"success": True, "medication": response.data[0]}


@router.post("/medications")
async def add_medication(medication_record: MedicationRecordCreate):
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
    return {"success": True, "medication": response.data}


@router.put("/medications/{medication_id}")
async def update_medication(
    medication_id: int,
    updated_record: MedicationRecordUpdate,
):
    update_data = updated_record.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        supabase.table("medications")
        .update(update_data)
        .eq("medication_id", medication_id)
        .execute()
    )
    return {"success": True, "updated_medication": response.data}


@router.delete("/medications/{medication_id}")
async def delete_medication(medication_id: int):
    supabase.table("medications").delete().eq("medication_id", medication_id).execute()
    return {"success": True}


# ------------------------------------------------------------------
# Medication stock routes
# ------------------------------------------------------------------

@router.post("/medications/{medication_id}/stock")
async def add_medication_to_stock(
    medication_id: int,
    stock_record: StockRecordCreate,
    user_id: UUID = Depends(get_current_user),
):
    response = (
        supabase.table("user_medication_stock")
        .insert({
            "user_id": str(user_id),
            "medication_id": medication_id,
            "quantity": stock_record.quantity,
            "unit": stock_record.unit,
            "expiration_date": stock_record.expiration_date.isoformat(),
            "opened_at": stock_record.opened_at.isoformat() if stock_record.opened_at else None,
            "notes": stock_record.notes,
        })
        .execute()
    )
    return {"success": True, "stock": response.data}


@router.get("/user/medications")
async def get_all_user_medications(user_id: UUID = Depends(get_current_user)):
    response = (
        supabase.table("user_medication_stock")
        .select("*")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {"success": True, "medications": response.data}


@router.get("/medications/stock/{stock_id}")
async def get_user_medication_stock(
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
    return {"success": True, "stock": response.data[0]}