from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db

from app.models.shop import ShopDB
from app.models.shop_finance import ShopFinanceDB
from app.models.sale import SaleDB
from app.models.product import ProductDB
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB
from app.models.customer import CustomerDB


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_shop: ShopDB = Depends(get_current_shop),
):
    """
    Return dashboard data for the currently authenticated shop.

    All shop-owned data is filtered using the current shop.
    """

    shop_id = current_shop.shop_id

    # =========================================================
    # 1. SHOP FINANCE
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
    #
    # Credit ownership:
    #
    # CreditDB
    #     ↓ customer_id
    # CustomerDB
    #     ↓ shop_id
    # Shop
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

    total_credit = float(total_credit or 0)
    total_credit_payments = float(
        total_credit_payments or 0
    )

    outstanding_credit = max(
        total_credit - total_credit_payments,
        0.0,
    )

    # =========================================================
    # 4. INVENTORY
    # =========================================================

    products = (
        db.query(ProductDB)
        .filter(
            ProductDB.shop_id == shop_id
        )
        .all()
    )

    inventory_alerts = []

    for product in products:

        current_stock = (
            product.current_stock or 0
        )

        average_daily_sales = (
            product.average_daily_sales or 0
        )

        if average_daily_sales > 0:

            days_of_stock = (
                current_stock
                / average_daily_sales
            )

        else:

            days_of_stock = None

        # Products with 3 days or less
        # of estimated stock remaining
        # are shown as inventory alerts.

        if (
            days_of_stock is not None
            and days_of_stock <3
        ):

            inventory_alerts.append(
                {
                    "product_id": product.product_id,
                    "name": product.name,
                    "current_stock": current_stock,
                    "average_daily_sales": (
                        average_daily_sales
                    ),
                    "days_of_stock": round(
                        days_of_stock,
                        1,
                    ),
                }
            )

    # Sort most urgent products first.

    inventory_alerts.sort(
        key=lambda item: item["days_of_stock"]
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
                "sale_id": sale.sale_id,
                "product_id": sale.product_id,
                "product_name": product.name,
                "quantity": sale.quantity,
                "unit_selling_price": float(
                    sale.unit_selling_price
                ),
                "total_amount": float(
                    sale.total_amount
                ),
                "payment_mode": sale.payment_mode,
                "created_at": sale.created_at,
            }
        )

    # =========================================================
    # 6. DASHBOARD RESPONSE
    # =========================================================

    return {
        "shop": {
            "shop_id": shop_id,
            "shop_name": current_shop.name,
        },

        "summary": {
            "available_cash": available_cash,
            "today_sales": today_sales,
            "outstanding_credit": outstanding_credit,
        },

        "inventory": {
            "total_products": len(products),
            "alert_count": len(
                inventory_alerts
            ),
            "alerts": inventory_alerts,
        },

        "recent_transactions": (
            recent_transactions
        ),
    }