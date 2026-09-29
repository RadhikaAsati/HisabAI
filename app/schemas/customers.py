
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1)
    phone: str | None = None


class CustomerResponse(BaseModel):
    customer_id: int
    name: str
    phone: str | None