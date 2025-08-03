from pydantic import BaseModel

class LabelPipelineRequest(BaseModel):
    url:str