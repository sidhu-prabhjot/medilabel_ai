from pydantic import BaseModel
from fastapi import UploadFile

class LabelPipelineRequest(BaseModel):
    image: UploadFile