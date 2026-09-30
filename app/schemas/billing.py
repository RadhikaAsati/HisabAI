from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BillingItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_selling_price: float = Field(gt=0)


class BillingCreate(BaseModel):
    customer_id: int | None = None
    payment_mode: Literal["CASH", "CREDIT"]
    items: list[BillingItem] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_billing(self):
        if self.payment_mode == "CREDIT" and self.customer_id is None:
            raise ValueError("customer_id is required for CREDIT billing.")

        if self.payment_mode == "CASH" and self.customer_id is not None:
            raise ValueError("customer_id should not be provided for CASH billing.")

        product_ids = [item.product_id for item in self.items]

        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Each product can appear only once in a bill.")

        return self


class BillingItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_selling_price: float
    total_amount: float


class BillingResponse(BaseModel):
    total_amount: float
    payment_mode: Literal["CASH", "CREDIT"]
    customer_id: int | None
    items: list[BillingItemResponse]
    credit_id: int | None = None