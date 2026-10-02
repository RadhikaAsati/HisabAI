from fastapi import APIRouter, Depends, HTTPException,File, UploadFile
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.schemas.ai import (
    AIAskRequest,
    AIAskResponse,
    BillConfirmation,
    BillExtraction,
    TransactionExtraction,
    VoiceSaleConfirmation,
)
from datetime import datetime, timedelta, timezone
from app.models.product import ProductDB
from app.models.shop import ShopDB
from app.models.shop_finance import ShopFinanceDB
from app.models.sale import SaleDB
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB
from app.models.customer import CustomerDB

from app.schemas.billing import BillingCreate, BillingItem
from app.services.ai_service import ai_service
from app.services.billing_service import create_billing_transaction

router = APIRouter(prefix="/ai", tags=["AI"])


class AITextRequest(BaseModel):
    text: str


@router.post("/voice-entry")
def voice_entry(
    request: AITextRequest,
    db: Session = Depends(get_db),
    current_shop: ShopDB = Depends(get_current_shop),
):
    extraction = ai_service.extract_transaction(request.text)

    matched_product = None

    if extraction.product_name:
        matched_product = ai_service.match_product(
            db=db,
            shop_id=current_shop.shop_id,
            product_name=extraction.product_name,
        )

    return {
        "extraction": extraction,
        "product_match": (
            {
                "product_id": matched_product.product_id,
                "name": matched_product.name,
                "current_stock": matched_product.current_stock,
                "purchase_price": matched_product.purchase_price,
            }
            if matched_product
            else None
        ),
    }


@router.post("/voice-entry/confirm")
def confirm_voice_sale(
    confirmation: VoiceSaleConfirmation,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------
    # Step 1: Validate quantity
    # --------------------------------------------------
    if confirmation.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero.",
        )

    # --------------------------------------------------
    # Step 2: Validate total amount
    # --------------------------------------------------
    if confirmation.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total amount must be greater than zero.",
        )

    # --------------------------------------------------
    # Step 3: Calculate selling price per unit
    # --------------------------------------------------
    unit_selling_price = (
        confirmation.total_amount / confirmation.quantity
    )

    # --------------------------------------------------
    # Step 4: Build the existing billing request
    # --------------------------------------------------
    billing = BillingCreate(
        payment_mode=confirmation.payment_mode,
        customer_id=None,
        items=[
            {
                "product_id": confirmation.product_id,
                "quantity": confirmation.quantity,
                "unit_selling_price": unit_selling_price,
            }
        ],
    )

    # --------------------------------------------------
    # Step 5: Use the shared billing service
    # --------------------------------------------------
    try:
        result = create_billing_transaction(
            db=db,
            billing=billing,
            current_shop=current_shop,
        )

        return {
            "message": "Voice sale confirmed successfully.",
            "product_id": confirmation.product_id,
            "quantity": confirmation.quantity,
            "unit_selling_price": unit_selling_price,
            "total_amount": result["total_amount"],
            "payment_mode": result["payment_mode"],
            "remaining_stock": (
                db.query(ProductDB)
                .filter(
                    ProductDB.product_id == confirmation.product_id,
                    ProductDB.shop_id == current_shop.shop_id,
                )
                .first()
                .current_stock
            ),
        }

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Voice sale could not be completed.",
        )

@router.post("/scan-bill")
async def scan_bill(
    file: UploadFile = File(...),
    current_shop: ShopDB = Depends(get_current_shop),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image of the bill.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded bill is empty.",
        )

    try:
        extraction = ai_service.extract_bill(
            image_bytes=image_bytes,
            mime_type=file.content_type,
        )

        return {
            "filename": file.filename,
            "extraction": extraction,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract bill data: {str(error)}",
        )

@router.post("/scan-bill/confirm")
def confirm_scanned_bill(
    confirmation: BillConfirmation,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    try:
        # -----------------------------------------
        # Step 1: Validate customer if CREDIT
        # -----------------------------------------
        customer_id = None

        if confirmation.payment_mode == "CREDIT":
            customer = (
                db.query(CustomerDB)
                .filter(
                    CustomerDB.customer_id
                    == confirmation.customer_id,
                    CustomerDB.shop_id
                    == current_shop.shop_id,
                )
                .first()
            )

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found.",
                )

            customer_id = customer.customer_id

        # -----------------------------------------
        # Step 2: Match products to this shop
        # -----------------------------------------
        billing_items = []

        for item in confirmation.items:
            product = (
                db.query(ProductDB)
                .filter(
                    ProductDB.product_id == item.product_id,
                    ProductDB.shop_id == current_shop.shop_id,
                )
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found.",
                )

            billing_items.append(
                BillingItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_selling_price=item.unit_selling_price,
                )
            )

        # -----------------------------------------
        # Step 3: Build normal billing request
        # -----------------------------------------
        billing = BillingCreate(
            customer_id=customer_id,
            payment_mode=confirmation.payment_mode,
            items=billing_items,
        )

        # -----------------------------------------
        # Step 4: Reuse existing billing service
        # -----------------------------------------
        result = create_billing_transaction(
            db=db,
            billing=billing,
            current_shop=current_shop,
            customer_id=customer_id,
        )

        return {
            "message": "Scanned bill confirmed successfully.",
            "bill": result,
        }

    except HTTPException:
        db.rollback()
        raise

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        db.rollback()
        print("SCAN BILL CONFIRM ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not confirm scanned bill.",
        )

@router.post("/ask", response_model=AIAskResponse)
def ask_hisabai(
    request: AIAskRequest,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    shop_id = current_shop.shop_id

    # =========================================================
    # 1. AVAILABLE CASH
    # =========================================================

    finance = (
        db.query(ShopFinanceDB)
        .filter(
            ShopFinanceDB.shop_id == shop_id
        )
        .first()
    )

    available_cash = (
        float(finance.available_cash)
        if finance
        else 0.0
    )

    # =========================================================
    # 2. TODAY'S SALES
    # =========================================================

    now = datetime.now(timezone.utc)

    start_of_today = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    start_of_tomorrow = (
        start_of_today + timedelta(days=1)
    )

    today_sales = (
        db.query(
            func.coalesce(
                func.sum(SaleDB.total_amount),
                0,
            )
        )
        .join(
            ProductDB,
            ProductDB.product_id == SaleDB.product_id,
        )
        .filter(
            ProductDB.shop_id == shop_id,
            SaleDB.created_at >= start_of_today,
            SaleDB.created_at < start_of_tomorrow,
        )
        .scalar()
    )

    today_sales = float(today_sales or 0)

    # =========================================================
    # 3. OUTSTANDING UDHAAR
    # =========================================================

    total_credit = (
        db.query(
            func.coalesce(
                func.sum(CreditDB.amount),
                0,
            )
        )
        .join(
            CustomerDB,
            CustomerDB.customer_id == CreditDB.customer_id,
        )
        .filter(
            CustomerDB.shop_id == shop_id
        )
        .scalar()
    )

    total_credit_payments = (
        db.query(
            func.coalesce(
                func.sum(CreditPaymentDB.amount),
                0,
            )
        )
        .join(
            CreditDB,
            CreditDB.credit_id == CreditPaymentDB.credit_id,
        )
        .join(
            CustomerDB,
            CustomerDB.customer_id == CreditDB.customer_id,
        )
        .filter(
            CustomerDB.shop_id == shop_id
        )
        .scalar()
    )

    outstanding_credit = max(
        float(total_credit or 0)
        - float(total_credit_payments or 0),
        0.0,
    )

    # =========================================================
    # 4. PRODUCT / INVENTORY DATA
    # =========================================================

    products = (
        db.query(ProductDB)
        .filter(
            ProductDB.shop_id == shop_id
        )
        .all()
    )

    product_context = []

    for product in products:
        current_stock = float(
            product.current_stock or 0
        )

        average_daily_sales = float(
            product.average_daily_sales or 0
        )

        if average_daily_sales > 0:
            days_of_stock = (
                current_stock
                / average_daily_sales
            )
        else:
            days_of_stock = None

        product_context.append(
            {
                "name": product.name,
                "current_stock": current_stock,
                "average_daily_sales": average_daily_sales,
                "days_of_stock": (
                    round(days_of_stock, 1)
                    if days_of_stock is not None
                    else None
                ),
            }
        )

    # =========================================================
    # 5. RECENT TRANSACTIONS
    # =========================================================

    recent_sales = (
        db.query(
            SaleDB,
            ProductDB,
        )
        .join(
            ProductDB,
            ProductDB.product_id == SaleDB.product_id,
        )
        .filter(
            ProductDB.shop_id == shop_id
        )
        .order_by(
            SaleDB.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_transactions = []

    for sale, product in recent_sales:
        recent_transactions.append(
            {
                "product_name": product.name,
                "quantity": sale.quantity,
                "total_amount": float(
                    sale.total_amount
                ),
                "payment_mode": sale.payment_mode,
            }
        )

    # =========================================================
    # 6. ASK GEMINI
    # =========================================================

    try:
        answer = ai_service.answer_business_question(
            question=question,
            shop_name=current_shop.name,
            available_cash=available_cash,
            today_sales=today_sales,
            outstanding_credit=outstanding_credit,
            products=product_context,
            recent_transactions=recent_transactions,
        )

        return AIAskResponse(answer=answer)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="HisabAI could not answer the question right now.",
        )

# -----------------------------------------
# GET /ai/profit-watch
# Profit and margin analysis from real sales
# -----------------------------------------
@router.get("/profit-watch")
def profit_watch(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    shop_id = current_shop.shop_id

    # Get sales joined with products belonging to this shop
    sales_data = (
        db.query(
            ProductDB.product_id,
            ProductDB.name,
            ProductDB.purchase_price,
            func.sum(SaleDB.quantity).label("quantity_sold"),
            func.sum(SaleDB.total_amount).label("sales_revenue"),
        )
        .join(
            SaleDB,
            SaleDB.product_id == ProductDB.product_id,
        )
        .filter(
            ProductDB.shop_id == shop_id,
        )
        .group_by(
            ProductDB.product_id,
            ProductDB.name,
            ProductDB.purchase_price,
        )
        .all()
    )

    product_results = []

    total_sales = 0.0
    total_cost = 0.0
    total_profit = 0.0

    for row in sales_data:
        quantity_sold = float(row.quantity_sold or 0)
        sales_revenue = float(row.sales_revenue or 0)
        purchase_price = float(row.purchase_price or 0)

        cost = quantity_sold * purchase_price
        gross_profit = sales_revenue - cost

        if sales_revenue > 0:
            margin_percentage = (
                gross_profit / sales_revenue
            ) * 100
        else:
            margin_percentage = 0.0

        if margin_percentage < 15:
            status = "WATCH"
        else:
            status = "HEALTHY"

        product_results.append(
            {
                "product_id": row.product_id,
                "product_name": row.name,
                "quantity_sold": quantity_sold,
                "sales_revenue": round(sales_revenue, 2),
                "cost": round(cost, 2),
                "gross_profit": round(gross_profit, 2),
                "margin_percentage": round(margin_percentage, 2),
                "status": status,
            }
        )

        total_sales += sales_revenue
        total_cost += cost
        total_profit += gross_profit

    if total_sales > 0:
        overall_margin = (
            total_profit / total_sales
        ) * 100
    else:
        overall_margin = 0.0

    # Highest-priority products first:
    # WATCH products before HEALTHY products,
    # then lowest margin first.
    product_results.sort(
        key=lambda item: (
            item["status"] != "WATCH",
            item["margin_percentage"],
        )
    )

    return {
        "shop_name": current_shop.name,
        "summary": {
            "total_sales": round(total_sales, 2),
            "total_cost": round(total_cost, 2),
            "gross_profit": round(total_profit, 2),
            "overall_margin_percentage": round(overall_margin, 2),
        },
        "products": product_results,
    }