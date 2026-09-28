
from pydantic import BaseModel, Field


class Product(BaseModel):
    product_id: int
    name: str
    current_stock: int = Field(ge=0)
    average_daily_sales: float = Field(ge=0)
    purchase_price: float = Field(gt=0)
    supplier_lead_time_days: int = Field(ge=0)


class ShopFinance(BaseModel):
    available_cash: float = Field(ge=0)
    pending_customer_payments: float = Field(ge=0)
    cash_reserve: float = Field(ge=0)


class PurchasePlanRequest(BaseModel):
    products: list[Product]
    finance: ShopFinance


from typing import Literal


class PurchaseRecommendation(BaseModel):
    product_id: int
    product_name: str
    status: Literal["BUY", "POSTPONE", "ENOUGH_STOCK"]
    order_quantity: int
    unit_price: float
    total_cost: float
    days_of_stock: float
    reason: str


class PurchasePlanResponse(BaseModel):
    recommendations: list[PurchaseRecommendation]
    total_purchase_cost: float
    spendable_cash: float
    remaining_spendable_cash: float
    cash_after_purchase: float
    protected_reserve: float