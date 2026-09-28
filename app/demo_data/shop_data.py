
from app.schemas.planner import (
    Product,
    ShopFinance,
    PurchasePlanRequest,
)


# Fictional shop inventory
products = [
    Product(
        product_id=1,
        name="Milk",
        current_stock=20,
        average_daily_sales=10,
        purchase_price=50,
        supplier_lead_time_days=1,
    ),
    Product(
        product_id=2,
        name="Bread",
        current_stock=15,
        average_daily_sales=5,
        purchase_price=40,
        supplier_lead_time_days=1,
    ),
    Product(
        product_id=3,
        name="Biscuits",
        current_stock=40,
        average_daily_sales=4,
        purchase_price=30,
        supplier_lead_time_days=2,
    ),
    Product(
        product_id=4,
        name="Maggi",
        current_stock=60,
        average_daily_sales=5,
        purchase_price=15,
        supplier_lead_time_days=2,
    ),
]


# Fictional shop finances
finance = ShopFinance(
    available_cash=5000,
    pending_customer_payments=8400,
    cash_reserve=1000,
)


# Combine inventory and finances into one request
demo_request = PurchasePlanRequest(
    products=products,
    finance=finance,
)