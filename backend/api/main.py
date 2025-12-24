from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from io import BytesIO
from ml_models.run_pipeline import process_medical_label
import os
from PIL import Image
from supabase import create_client, Client
from uuid import UUID

from .schemas.symptom_logs import SymptomLogCreate, SymptomLogUpdate

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_KEY not set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
async def get_user_symptom_logs(user_id: UUID):
    try:
        response = supabase.table("symptom_logs").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user symptom logs: {str(e)}")

@app.post("/api/users/{user_id}/symptoms")
async def add_user_symptom_log(user_id: UUID, symptom_log: SymptomLogCreate):
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
async def update_user_symptom_log(user_id: UUID, symptom_id: str, symptom_log_update: SymptomLogUpdate):
    try:
        update_data = symptom_log_update.dict(exclude_unset = True) #exclude not provided fields

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("symptom_logs").update(update_data).eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user symptom log: {str(e)}")
    
@app.delete("/api/user/{user_id}/symptoms/{symptom_id}")
async def delete_user_symptom_log(user_id: UUID, symptom_id: str):
    try:
        response = supabase.table("symptom_logs").delete().eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user symptom log: {str(e)}")

