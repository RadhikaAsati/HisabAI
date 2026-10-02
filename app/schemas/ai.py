from typing import Literal, Optional

from pydantic import BaseModel,model_validator


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


class BillItemExtraction(BaseModel):
    product_name: str
    quantity: float
    unit_price: float
    total_amount: float


class BillExtraction(BaseModel):
    supplier_name: Optional[str] = None
    customer_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    items: list[BillItemExtraction]
    grand_total: Optional[float] = None
    confidence: float


class BillConfirmationItem(BaseModel):
    product_id: int
    quantity: int
    unit_selling_price: float


class BillConfirmation(BaseModel):
    customer_id: int | None = None
    payment_mode: Literal["CASH", "UPI", "CREDIT"]
    items: list[BillConfirmationItem]

    @model_validator(mode="after")
    def validate_confirmation(self):
        if self.payment_mode == "CREDIT" and self.customer_id is None:
            raise ValueError(
                "customer_id is required for CREDIT billing."
            )

        if self.payment_mode in ("CASH", "UPI"):
            self.customer_id = None

        if not self.items:
            raise ValueError("At least one bill item is required.")

        return self

class AIAskRequest(BaseModel):
    question: str


class AIAskResponse(BaseModel):
    answer: str