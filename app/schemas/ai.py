from typing import Literal, Optional

from pydantic import BaseModel


class TransactionExtraction(BaseModel):
    transaction_type: Literal["SALE", "PURCHASE", "EXPENSE"]
    product_name: Optional[str] = None
    quantity: Optional[float] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    confidence: float


class VoiceSaleConfirmation(BaseModel):
    product_id: int
    quantity: int
    total_amount: float
    payment_mode: Literal["CASH", "UPI"] = "CASH"