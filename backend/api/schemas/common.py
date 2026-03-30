from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")


class DataResponse(BaseModel, Generic[T]):
    data: T


class SuccessResponse(BaseModel):
    success: bool
