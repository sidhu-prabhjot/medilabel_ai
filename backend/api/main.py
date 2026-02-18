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
from .schemas.body_metric_record import BodyMetricRecordCreate, BodyMetricRecordUpdate
from .schemas.workout_record import WorkoutRecordCreate, WorkoutRecordUpdate
from .schemas.exercise_record import ExerciseRecordCreate, ExerciseRecordUpdate
from .schemas.workout_exercise_record import WorkoutExerciseRecordCreate, WorkoutExerciseRecordUpdate
from .schemas.set_record import SetRecordCreate, SetRecordUpdate
from .schemas.workout_routine_record import WorkoutRoutineCreate, WorkoutRoutineUpdate
from .schemas.routine_exercise_record import RoutineExerciseRecordCreate, RoutineExerciseRecordUpdate
from .schemas.routine_set_record import RoutineSetRecordCreate, RoutineSetRecordUpdate

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

#*****MEDICATION-RELATED ENDPOINTS*****
@app.get("/api/symptoms")
async def get_user_symptom_logs(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("symptom_logs").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user symptom logs: {str(e)}")

@app.post("/api/symptoms")
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

@app.put("/api/symptoms/{symptom_id}")
async def update_user_symptom_log(symptom_id: str, symptom_log_update: SymptomLogUpdate, user_id: UUID = Depends(get_current_user_id)):
    try:
        update_data = symptom_log_update.dict(exclude_unset = True) #exclude not provided fields

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("symptom_logs").update(update_data).eq("symptom_id", symptom_id).eq("user_id", str(user_id)).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user symptom log: {str(e)}")
    
@app.delete("/api/symptoms/{symptom_id}")
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
    
@app.post("/api/medications/{medication_id}/stock")
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
    
@app.get("/api/medications/stock/{stock_id}")
async def get_user_medication(stock_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("user_medication_stock").select("*").eq("user_id", user_id).eq("stock_id", stock_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user medication: {str(e)}")
    
#*****WORKOUT-RELATED ENDPOINTS*****
#exercises
@app.post("/api/exercises")
async def create_exercise(exercise_record: ExerciseRecordCreate):
    try:
        response = supabase.table("exercises").insert({
            "exercise_name": exercise_record.exercise_name,
            "muscle_group": exercise_record.muscle_group,
            "equipment": exercise_record.equipment
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding new exercise: {str(e)}")
    
@app.get("/api/exercises")
async def get_all_exercises():
    try:
        response = supabase.table("exercises").select("*").execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all exercises: {str(e)}")
    
@app.get("/api/exercises")
async def get_exercise(exercise_id: int):
    try:
        response = supabase.table("exercises").select("*").eq("id", exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting exercise matching id {exercise_id}: {str(e)}")
    

#workouts
@app.post("/api/body-metrics")
async def add_user_body_metric_entry(body_metric_record: BodyMetricRecordCreate, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("body_metrics").insert({
            "user_id": str(user_id),
            "weight_kg": float(body_metric_record.weight_kg),
            "body_fat_percent": float(body_metric_record.body_fat_percent),
            "recorded_at": body_metric_record.recorded_at.isoformat(),
            "notes": body_metric_record.notes
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding new user body metrics: {str(e)}")
    
@app.get("/api/body-metrics")
async def get_all_user_body_metrics_entries(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("body_metrics").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all user body metrics entries: {str(e)}")
    
@app.get("/api/body-metrics/latest")
async def get_latest_user_body_metric(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("body_metrics").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).single().execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting the most recent user data metrics entry: {str(e)}")
    
@app.put("/api/body-metrics/{metric_id}")
async def update_user_body_metric_entry(metric_id: int, updated_record: BodyMetricRecordUpdate, user_id: UUID = Depends(get_current_user_id)):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        update_data["recorded_at"] = datetime.now(timezone.utc).isoformat()
        update_data["weight_kg"] = float(update_data["weight_kg"])
        update_data["body_fat_percent"] = float(update_data["body_fat_percent"])

        response = supabase.table("body_metrics").update(update_data).eq("id", metric_id).eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the user data metrics entry: {str(e)}")

@app.delete("/api/body-metrics/{metric_id}")
async def delete_user_body_metric_entry(metric_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("body_metrics").delete().eq("user_id", user_id).eq("id", metric_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting medication record: {str(e)}")
    
#workouts
@app.post("/api/workouts")
async def add_new_workout(workout_record: WorkoutRecordCreate, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workouts").insert({
            "user_id": str(user_id),
            "workout_name": workout_record.workout_name,
            "workout_date": workout_record.workout_date.isoformat(),
            "duration_minutes": workout_record.duration_minutes,
            "notes": workout_record.notes
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding a new workout: {str(e)}")

@app.get("/api/workouts")
async def get_all_user_workouts(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workouts").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all user workouts: {str(e)}")

@app.get("/api/workouts/{workout_id}")
async def get_workout_with_workout_id(workout_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workouts").select("*").eq("id", workout_id).eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting workout with matching workout id: {str(e)}")

@app.put("/api/workouts/{workout_id}")
async def update_workout_metadata(workout_id: int, updated_record: WorkoutRecordUpdate, user_id: UUID = Depends(get_current_user_id)):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        update_data["workout_date"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("workouts").update(update_data).eq("id", workout_id).eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the user workout: {str(e)}")
    
@app.delete("/api/workouts/{workout_id}")
async def delete_user_workout(workout_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workouts").delete().eq("user_id", user_id).eq("id", workout_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user workout: {str(e)}")
    
#workout exercises
@app.post("/api/workouts/{workout_id}/exercises")
async def add_exercise_to_workout(workout_id: int, workout_exercise_record: WorkoutExerciseRecordCreate):
    try:
        response = supabase.table("workout_exercises").insert({
            "workout_id": workout_id,
            "exercise_id": workout_exercise_record.exercise_id,
            "order_index": workout_exercise_record.order_index,
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding exercise to workout: {str(e)}")  
    
@app.get("/api/workouts/{workout_id}/exercises")
async def get_exercises_in_workout(workout_id: int):
    try:
        response = supabase.table("workout_exercises").select("*").eq("id", workout_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding getting exercises a part of the workout: {str(e)}") 
    
@app.put("/api/workout-exercises/{workout_exercise_id}")
async def update_order(workout_exercise_id: int, updated_data: WorkoutExerciseRecordUpdate):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        response = supabase.table("workout_exercises").update(update_data).eq("id", workout_exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the order of the workout exercise: {str(e)}")
    
@app.delete("/api/workout-exercises/{workout_exercise_id}")
async def delete_exercise_from_workout(workout_exercise_id: int):
    try:
        response = supabase.table("workout_exercises").delete().eq("id", workout_exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting exercise from workout: {str(e)}")
    
#sets
@app.post("/api/workout-exercises/{workout_exercise_id}/sets")
async def add_set_log_to_workout_exercise(workout_exercise_id:int, set_record: SetRecordCreate):
    try:
        response = supabase.table("sets").insert({
            "workout_exercise_id": workout_exercise_id,
            "reps": set_record.reps,
            "weight_kg": float(set_record.weight_kg),
            "rest_seconds": set_record.rest_seconds,
            "rpe": float(set_record.rpe)
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding logged set to exercise: {str(e)}")  
    
@app.get("/api/workout-exercises/{workout_exercise_id}/sets")
async def get_all_logged_sets_for_workout_exercise(workout_exercise_id: int):
    try:
        response = supabase.table("sets").select("*").eq("workout_exercise_id", workout_exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all sets logged for workout exercise: {str(e)}")  
    
@app.put("/api/sets/{set_id}")
async def update_logged_set_for_workout_exercise(set_id: int, updated_record: SetRecordUpdate):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        update_data["weight_kg"] = float(update_data["weight_kg"])
        update_data["rpe"] = float(update_data["rpe"])

        response = supabase.table("sets").update(update_data).eq("id", set_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the logged set: {str(e)}")
    
@app.delete("/api/sets/{set_id}")
async def delete_logged_set(set_id: int):
    try:
        response = supabase.table("sets").delete().eq("id", set_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting logged set: {str(e)}")
    
#routines
@app.post("/api/workout-routines")
async def create_user_workout_routine(workout_routine_record: WorkoutRoutineCreate, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workout_routines").insert({
            "user_id": str(user_id),
            "routine_name": workout_routine_record.routine_name,
            "description": workout_routine_record.description
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding workout routine: {str(e)}")  
    
@app.get("/api/workout-routines")
async def get_all_user_workout_routines(user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workout_routines").select("*").eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all user workout routines: {str(e)}") 
    
@app.put("/api/workout-routines/{routine_id}")
async def update_user_workout_routine(routine_id: int, updated_record: WorkoutRoutineUpdate, user_id: UUID = Depends(get_current_user_id)):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        response = supabase.table("workout_routines").update(update_data).eq("id", routine_id).eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user workout routine: {str(e)}")
    
@app.delete("/api/workout-routines/{routine_id}")
async def delete_user_workout_routine(routine_id: int, user_id: UUID = Depends(get_current_user_id)):
    try:
        response = supabase.table("workout_routines").delete().eq("id", routine_id).eq("user_id", user_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user workout routine: {str(e)}")
    
#routine exercises 
@app.post("/api/workout-routines/{routine_id}/exercises")
async def add_exercise_to_workout_routine(routine_id: int, routine_exercise_record: RoutineExerciseRecordCreate):
    try:
        response = supabase.table("routine_exercises").insert({
            "routine_id": routine_id,
            "exercise_id": routine_exercise_record.exercise_id,
            "order_index": routine_exercise_record.order_index,
            "notes": routine_exercise_record.notes
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding exercise to workout routine: {str(e)}")  

@app.get("/api/workout-routines/{routine_id}/exercises")
async def get_all_exercises_in_workout_routine(routine_id: int):
    try:
        response = (
            supabase
            .table("routine_exercises")
            .select("*")
            .eq("routine_id", routine_id)
            .order("order_index", desc=False)
            .execute()
        )

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all exercises in routine: {str(e)}")  

@app.put("/api/routine-exercises/{exercise_id}")
async def update_exercise_in_workout_routine(exercise_id: int, updated_record: RoutineExerciseRecordUpdate):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        response = supabase.table("routine_exercises").update(update_data).eq("id", exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the exercise in the workout routine: {str(e)}")   
    
@app.delete("/api/routine-exercises/{exercise_id}")
async def delete_exercise_in_workout_routine(exercise_id: int):
    try:
        response = supabase.table("routine_exercises").delete().eq("exercise_id", exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting exercise in workout routine: {str(e)}")
    
#routine exercises sets
@app.post("/api/routine-exercises/{routine_exercise_id}/sets")
async def add_planned_set_to_routine_exercise(routine_exercise_id: int, routine_set_record: RoutineSetRecordCreate):
    try:
        response = supabase.table("routine_sets").insert({
            "routine_exercise_id": routine_exercise_id,
            "target_reps": routine_set_record.target_reps,
            "target_weight": float(routine_set_record.target_weight),
            "target_rpe": float(routine_set_record.target_rpe),
            "set_order": routine_set_record.set_order
        }).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding planned set to routine exercise: {str(e)}")  
    
@app.get("/api/routine-exercises/{routine_exercise_id}/sets")
async def get_all_planned_sets_in_routine_exercise(routine_exercise_id: int):
    try:
        response = supabase.table("routine_sets").select("*").eq("routine_exercise_id", routine_exercise_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting all sets belonging to routine exercise: {str(e)}") 

@app.get("/api/routine-sets/{set_id}")  
async def get_planned_set_in_routine_exercise(set_id: int):
    try:
        respones = supabase.table("routine_sets").select("*").eq("id", set_id).execute()

        return respones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting planned set with id={set_id}: {str(e)}") 
    
@app.put("/api/routine-sets/{set_id}")
async def update_planned_set_details(set_id: int, updated_record: RoutineSetRecordUpdate):
    try:
        update_data = updated_record.dict(exclude_unset = True)

        response = supabase.table("routine_sets").update(update_data).eq("id", set_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating the planned set: {str(e)}")  
    
@app.delete("/api/routine-sets/{set_id}")
async def delete_planned_set(set_id: int):
    try:
        response = supabase.table("routine_sets").delete().eq("id", set_id).execute()

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting planned set: {str(e)}")