
from datetime import datetime

from pydantic import BaseModel, Field


class CreditPaymentCreate(BaseModel):
    credit_id: int
    amount: float = Field(gt=0)
    payment_method: str | None = None


class CreditPaymentResponse(BaseModel):
    payment_id: int
    credit_id: int
    amount: float
    payment_method: str | None
    created_at: datetime