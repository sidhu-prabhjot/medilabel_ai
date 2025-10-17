from fastapi import FastAPI, HTTPException, File, UploadFile
from ml_models.run_pipeline import process_medical_label
from .schemas import LabelPipelineRequest
import os
import uuid
import requests
from PIL import Image
from io import BytesIO

app = FastAPI()

TEMP_IMAGE_DIR = "temp_url_images"
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

# For uploading an image file and running AI analysis pipeline on it
@app.post("/api/upload/")
async def analyze_label_from_file(file: UploadFile):

    # check if something other than image file was uploaded
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")

    #check if the file is empty
    if file.size == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded. Please upload a valid image file.")

    #try to process the image file
    try:
        # Read bytes and create PIL Image
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        results = process_medical_label(image)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


    return {"content-type": file.content_type}


# @app.get("/api/history/")
# async def root():
#     return {"message": "history"}