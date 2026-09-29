
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.shop_finance import ShopFinanceDB
from app.db.database import get_db
from app.models.product import ProductDB
from app.models.purchase import PurchaseDB

from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.schemas.planner import (
    Product,
    ShopFinance,
    PurchasePlanRequest,
    PurchasePlanResponse,
)
from app.services.purchase_planner import generate_purchase_plan


router = APIRouter(tags=["Purchase Planner"])


# -----------------------------------------
# POST /purchase-plan
# Generate a purchase plan from given data
# -----------------------------------------
@router.post(
    "/purchase-plan",
    response_model=PurchasePlanResponse,
)
def create_purchase_plan(
    request: PurchasePlanRequest,
) -> PurchasePlanResponse:
    """Generate a purchase plan from provided product data."""
    return generate_purchase_plan(request)


# -----------------------------------------
# POST /purchase-plan/saved
# Generate a plan using saved database data
# -----------------------------------------
@router.post(
    "/purchase-plan/saved",
    response_model=PurchasePlanResponse,
)
def create_saved_purchase_plan(
    db: Session = Depends(get_db),
) -> PurchasePlanResponse:

    # Step 1: Fetch products from the database
    saved_products = (
        db.query(ProductDB)
        .order_by(ProductDB.product_id)
        .all()
    )

    if not saved_products:
        raise HTTPException(
            status_code=400,
            detail="No products found. Please add products first."
        )

    # Step 2: Fetch saved financial details
    saved_finance = (
        db.query(ShopFinanceDB)
        .filter(ShopFinanceDB.id == 1)
        .first()
    )

    if saved_finance is None:
        raise HTTPException(
            status_code=404,
            detail="No financial details found. Please save them first."
        )

    # Step 3: Convert database products into planner products
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

    # Step 4: Convert saved finance into the planner schema
    finance = ShopFinance(
        available_cash=saved_finance.available_cash,
        pending_customer_payments=saved_finance.pending_customer_payments,
        cash_reserve=saved_finance.cash_reserve,
    )

    # Step 5: Create the purchase plan
    request = PurchasePlanRequest(
        products=products,
        finance=finance,
    )

    return generate_purchase_plan(request)


# -----------------------------------------
# POST /purchases/
# Record a purchase and update stock
# -----------------------------------------
@router.post(
    "/purchases/",
    response_model=PurchaseResponse,
    status_code=201,
)
def record_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
):
    try:
        # Step 1: Find the product and lock its row
        product = (
            db.query(ProductDB)
            .filter(ProductDB.product_id == purchase.product_id)
            .with_for_update()
            .first()
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found",
            )

        # Step 2: Calculate the purchase cost
        total_amount = (
            purchase.quantity * purchase.unit_purchase_price
        )

        # Step 3: Create the purchase record
        new_purchase = PurchaseDB(
            product_id=purchase.product_id,
            quantity=purchase.quantity,
            unit_purchase_price=purchase.unit_purchase_price,
            total_amount=total_amount,
            payment_status=purchase.payment_status,
        )

        # Step 4: Increase the product stock
        product.current_stock += purchase.quantity

        # Step 5: Save both changes
        db.add(new_purchase)
        db.commit()
        db.refresh(new_purchase)

        # Step 6: Return purchase details
        return PurchaseResponse(
            purchase_id=new_purchase.purchase_id,
            product_id=new_purchase.product_id,
            quantity=new_purchase.quantity,
            unit_purchase_price=new_purchase.unit_purchase_price,
            total_amount=new_purchase.total_amount,
            payment_status=new_purchase.payment_status,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print("PURCHASE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to record purchase"
        )