from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import auth, medical, workouts, routines, exercises, body_metrics, plans

app = FastAPI()
# TEMP_IMAGE_DIR = "temp_url_images"
# os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # change to frontend URL after
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(medical.router)
app.include_router(workouts.router)
app.include_router(routines.router)
app.include_router(exercises.router)
app.include_router(body_metrics.router)
app.include_router(plans.router)

@app.get("/")
def root():
    return {"message": "MediLabel + Workout API is running!"}

# @app.post("/api/upload/")
# async def analyze_label_from_file(file: UploadFile):
#     if not file.content_type.startswith("image/"):
#         raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")

#     image_bytes = await file.read()
#     if len(image_bytes) == 0:
#         raise HTTPException(status_code=400, detail="Empty file uploaded.")

#     try:
#         image = Image.open(BytesIO(image_bytes)).convert("RGB")
#         results = process_medical_label(image)
#         return results
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
