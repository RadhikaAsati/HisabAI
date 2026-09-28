
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import ProductDB
from app.schemas.planner import (
    Product,
    ShopFinance,
    PurchasePlanRequest,
    PurchasePlanResponse,
)
from app.services.purchase_planner import generate_purchase_plan


router = APIRouter(tags=["Purchase Planner"])


@router.post(
    "/purchase-plan",
    response_model=PurchasePlanResponse,
)
def create_purchase_plan(
    request: PurchasePlanRequest,
) -> PurchasePlanResponse:
    """Generate a purchase plan from provided product data."""
    return generate_purchase_plan(request)


@router.post(
    "/purchase-plan/saved",
    response_model=PurchasePlanResponse,
)
def create_saved_purchase_plan(
    finance: ShopFinance,
    db: Session = Depends(get_db),
) -> PurchasePlanResponse:
    """Generate a purchase plan using products saved in PostgreSQL."""

    saved_products = (
        db.query(ProductDB)
        .order_by(ProductDB.product_id)
        .all()
    )

    if not saved_products:
        raise HTTPException(
            status_code=400,
            detail="No products found. Please add products first.",
        )

    products = [
        Product(
            product_id=p.product_id,
            name=p.name,
            current_stock=p.current_stock,
            average_daily_sales=p.average_daily_sales,
            purchase_price=p.purchase_price,
            supplier_lead_time_days=p.supplier_lead_time_days,
        )
        for p in saved_products
    ]

    request = PurchasePlanRequest(
        products=products,
        finance=finance,
    )

    return generate_purchase_plan(request)