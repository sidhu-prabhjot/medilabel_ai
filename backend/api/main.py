from fastapi import FastAPI, HTTPException
from ml_models.run_pipeline import process_medical_label
from .schemas import LabelPipelineRequest
import os
import uuid
import requests

app = FastAPI()

TEMP_IMAGE_DIR = "temp_url_images"
os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

#for uploading image and running ai analysis pipeline on it
#CURRENTLY WILL TAKE URL FOR IMAGE
@app.post("/api/upload/")
async def analyze_label_from_url(request_data: LabelPipelineRequest):
    image_url = request_data.url
    upload_id = uuid.uuid4()

    try:
        # 1. Download image
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()  # raises HTTPError for bad status

        content_type = response.headers.get("Content-Type", "")
        if "image" not in content_type:
            raise HTTPException(status_code=400, detail="URL does not point to an image")

        file_ext = content_type.split("/")[-1]  # e.g., jpeg, png
        file_name = f"{upload_id}.{file_ext}"
        file_path = os.path.join(TEMP_IMAGE_DIR, file_name)

        with open(file_path, "wb") as f:
            f.write(response.content)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error downloading image: {str(e)}")


    try:
        result = process_medical_label(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to complete analysis on image: {str(e)}")

    return {
        "upload_id": upload_idcd,
        "result": result
    }

# @app.get("/api/history/")
# async def root():
#     return {"message": "history"}