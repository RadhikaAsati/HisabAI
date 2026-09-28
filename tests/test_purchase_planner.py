
from app.schemas.planner import Product, ShopFinance
from app.services.purchase_planner import (
    calculate_days_of_stock,
    needs_restock,
    calculate_order_quantity,
    calculate_product_cost,
    calculate_spendable_cash,
    is_purchase_affordable,
)


def create_product():
    return Product(
        product_id=1,
        name="Milk",
        current_stock=20,
        average_daily_sales=10,
        purchase_price=50,
        supplier_lead_time_days=1,
    )


def test_calculate_days_of_stock():
    product = create_product()

    result = calculate_days_of_stock(product)

    assert result == 2


def test_needs_restock():
    product = create_product()

    result = needs_restock(product)

    assert result is True


def test_calculate_order_quantity():
    product = create_product()

    result = calculate_order_quantity(product)

    assert result == 10


def test_calculate_product_cost():
    product = create_product()

    result = calculate_product_cost(product, 10)

    assert result == 500


def test_calculate_spendable_cash():
    finance = ShopFinance(
        available_cash=5000,
        pending_customer_payments=8400,
        cash_reserve=1000,
    )

    result = calculate_spendable_cash(finance)

    assert result == 4000


def test_is_purchase_affordable():
    result = is_purchase_affordable(500, 1000)

    assert result is True


def test_zero_daily_sales():
    product = create_product()
    product.average_daily_sales = 0

    result = calculate_days_of_stock(product)

    assert result == float("inf")


def test_purchase_not_affordable():
    result = is_purchase_affordable(1500, 1000)

    assert result is False


def test_restock_when_stock_is_low():
    product = create_product()
    product.current_stock = 10

    result = needs_restock(product)

    assert result is True