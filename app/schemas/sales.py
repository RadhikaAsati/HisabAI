from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class SaleCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_selling_price: float = Field(gt=0)
    payment_mode: Literal["CASH", "UPI", "CREDIT"]


class SaleResponse(BaseModel):
    sale_id: int
    product_id: int
    product_name: str
    quantity: int
    unit_selling_price: float
    total_amount: float
    payment_mode: Literal["CASH", "UPI", "CREDIT"]
    created_at: datetime