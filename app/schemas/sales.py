
from pydantic import BaseModel, Field
from typing import Literal

class SaleCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_selling_price: float = Field(gt=0)
    payment_mode: Literal["CASH", "CREDIT"] 

class SaleResponse(BaseModel):
    sale_id: int
    product_id: int
    quantity: int
    unit_selling_price: float
    total_amount: float
    payment_mode: Literal["CASH", "CREDIT"]
