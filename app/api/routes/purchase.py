from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.models.product import ProductDB
from app.models.purchase import PurchaseDB
from app.models.shop import ShopDB
from app.models.shop_finance import ShopFinanceDB

from app.schemas.planner import (
    Product,
    PurchasePlanRequest,
    PurchasePlanResponse,
    ShopFinance,
)
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
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
    """
    Generate a purchase plan from product and
    financial data provided directly in the request.
    """
    return generate_purchase_plan(request)


# -----------------------------------------
# POST /purchase-plan/saved
# Generate a plan using saved shop data
# -----------------------------------------
@router.post(
    "/purchase-plan/saved",
    response_model=PurchasePlanResponse,
)
def create_saved_purchase_plan(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
) -> PurchasePlanResponse:

    # Step 1: Fetch products belonging only to
    # the currently authenticated shop.
    saved_products = (
        db.query(ProductDB)
        .filter(ProductDB.shop_id == current_shop.shop_id)
        .order_by(ProductDB.product_id)
        .all()
    )

    if not saved_products:
        raise HTTPException(
            status_code=400,
            detail="No products found. Please add products first.",
        )

    # Step 2: Fetch financial details belonging
    # only to the current shop.
    saved_finance = (
        db.query(ShopFinanceDB)
        .filter(
            ShopFinanceDB.shop_id == current_shop.shop_id
        )
        .first()
    )

    if saved_finance is None:
        raise HTTPException(
            status_code=404,
            detail="No financial details found. Please save them first.",
        )

    # Step 3: Convert database products into
    # planner product schemas.
    products = [
        Product(
            product_id=product.product_id,
            name=product.name,
            current_stock=product.current_stock,
            average_daily_sales=product.average_daily_sales,
            purchase_price=product.purchase_price,
            supplier_lead_time_days=product.supplier_lead_time_days,
        )
        for product in saved_products
    ]

    # Step 4: Convert saved finance into
    # the planner finance schema.
    finance = ShopFinance(
        available_cash=saved_finance.available_cash,
        pending_customer_payments=saved_finance.pending_customer_payments,
        cash_reserve=saved_finance.cash_reserve,
    )

    # Step 5: Build the planner request.
    request = PurchasePlanRequest(
        products=products,
        finance=finance,
    )

    # Step 6: Generate the purchase plan.
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
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    try:
        # Step 1: Find the product ONLY if it
        # belongs to the authenticated shop.
        product = (
            db.query(ProductDB)
            .filter(
                ProductDB.product_id == purchase.product_id,
                ProductDB.shop_id == current_shop.shop_id,
            )
            .with_for_update()
            .first()
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found",
            )

        # Step 2: Calculate the purchase cost.
        total_amount = (
            purchase.quantity * purchase.unit_purchase_price
        )

        # Step 3: Create the purchase record.
        new_purchase = PurchaseDB(
            product_id=purchase.product_id,
            quantity=purchase.quantity,
            unit_purchase_price=purchase.unit_purchase_price,
            total_amount=total_amount,
            payment_status=purchase.payment_status,
        )

        # Step 4: Increase stock.
        product.current_stock += purchase.quantity

        # Step 5: Save both changes.
        db.add(new_purchase)
        db.commit()
        db.refresh(new_purchase)

        # Step 6: Return purchase details.
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
            detail="Failed to record purchase",
        )