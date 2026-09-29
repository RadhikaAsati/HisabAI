
from datetime import datetime

from pydantic import BaseModel, Field


class CreditCreate(BaseModel):
    customer_id: int
    amount: float = Field(gt=0)
    description: str | None = None


class CreditResponse(BaseModel):
    credit_id: int
    customer_id: int
    amount: float
    paid_amount: float
    description: str | None
    created_at: datetime