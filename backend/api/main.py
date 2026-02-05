from backend.api.auth.auth import get_current_user_id
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, UploadFile
import httpx
from io import BytesIO
from ml_models.run_pipeline import process_medical_label
import os
from PIL import Image
from .db.supabase import supabase
from uuid import UUID

from .schemas.symptom_logs import SymptomLogCreate, SymptomLogUpdate
from .schemas.medication_record import MedicationRecordCreate, MedicationRecordUpdate
from .schemas.stock_record import StockRecordCreate

app = FastAPI()
TEMP_IMAGE_DIR = "temp_url_images"
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

@app.post("/api/upload/")
async def analyze_label_from_file(file: UploadFile):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        results = process_medical_label(image)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
@app.get("/api/users/{user_id}/symptoms")
async def get_user_symptom_logs(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("symptom_logs").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user symptom logs: {str(e)}")

@app.post("/api/users/{user_id}/symptoms")
async def add_user_symptom_log(symptom_log: SymptomLogCreate, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("symptom_logs").insert({
            "symptom": symptom_log.symptom,
            "severity": symptom_log.severity,
            "notes": symptom_log.notes,
            "is_resolved": symptom_log.is_resolved,
            "user_id": str(user_id)
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user symptom logs: {str(e)}")

@app.put("/api/user/{user_id}/symptoms/{symptom_id}")
async def update_user_symptom_log(symptom_id: str, symptom_log_update: SymptomLogUpdate, user_id: UUID = Depends(get_current_user_id)):
    try:
        update_data = symptom_log_update.dict(exclude_unset = True) #exclude not provided fields

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("symptom_logs").update(update_data).eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user symptom log: {str(e)}")
    
@app.delete("/api/user/{user_id}/symptoms/{symptom_id}")
async def delete_user_symptom_log(symptom_id: str, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("symptom_logs").delete().eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user symptom log: {str(e)}")

@app.get("/api/medications/search")
async def get_medication_search_results(medication_term: str):
    try: 
        async with httpx.AsyncClient() as client:
            #get id search results
            id_search_url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={medication_term}&search=9&allsrc=0"
            
            id_search_response = await client.get(id_search_url, timeout=5)
            id_search_response.raise_for_status()
            
            id_array = id_search_response.json()["idGroup"]["rxnormId"]

            #check if the ids exist in the database
            db_search_response = supabase.table("medications").select("*").in_("rxcui", id_array).execute()

            if db_search_response.data:
                return db_search_response
            
            #if search result not in db, fetch data for each id
            data = []

            for rxcui_id in id_array:

                properties_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui_id}/properties.json"

                properties_response = await client.get(properties_url, timeout=5)
                properties_response.raise_for_status()

                data.append(properties_response.json())

        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting search results {str(e)}")
    
@app.get("/api/medications/{medication_id}")
async def get_medication_record(medication_id: int):
    try:
        response = supabase.table("medications").select("*").eq("medication_id", medication_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting search results {str(e)}")
    
@app.post("/api/medications")
async def add_medication_record(medication_record: MedicationRecordCreate):
    try:
        #filter out unwanted TTYs
        if medication_record.tty.lower() not in ("bn", "sbd", "scd"):
            raise HTTPException(status_code=400, detail=f"Unsupported term type (TTY) {str(e)}")
        
        response = supabase.table("medications").insert({
            "rxcui": medication_record.rxcui,
            "name": medication_record.name,
            "generic_rxcui": None,
            "is_brand": True if medication_record.tty != "scd" else False
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error Adding medication to database: {str(e)}")
    
@app.put("/api/medications/{medication_id}")
async def update_medication_record(medication_id: int, updated_record: MedicationRecordUpdate):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("medications").update(update_data).eq("medication_id", medication_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating medication record: {str(e)}")
    
@app.delete("/api/medications/{medication_id}")
async def delete_medication_record(medication_id: int):
    try:
        response = supabase.table("medications").delete().eq("medication_id", medication_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting medication record: {str(e)}")
    
@app.post("/api/user/medications/{medication_id}/stock")
async def add_user_medication(medication_id: int, stock_record: StockRecordCreate, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("user_medication_stock").insert({
            "user_id": str(user_id),
            "medication_id": medication_id,
            "quantity": stock_record.quantity,
            "unit": stock_record.unit,
            "expiration_date": stock_record.expiration_date.isoformat(),
            "opened_at": stock_record.opened_at.isoformat(),
            "notes": stock_record.notes
        }).execute()

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding medication to user medication stock: {str(e)}")
    
@app.get("/api/user/medications")
async def get_all_user_medication(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("user_medication_stock").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting entire user medication stock: {str(e)}")
    
@app.get("/api/user/medications/stock/{stock_id}")
async def get_user_medication(stock_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("user_medication_stock").select("*").eq("user_id", user_id).eq("stock_id", stock_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user medication: {str(e)}")