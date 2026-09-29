
from typing import Literal

from pydantic import BaseModel, Field


class PurchaseCreate(BaseModel):
    product_id: int

    quantity: int = Field(gt=0)

    unit_purchase_price: float = Field(gt=0)

    payment_status: Literal["PAID", "UNPAID"] = "UNPAID"


class PurchaseResponse(BaseModel):
    purchase_id: int

    product_id: int

    quantity: int

    unit_purchase_price: float

    total_amount: float

    payment_status: Literal["PAID", "UNPAID"]