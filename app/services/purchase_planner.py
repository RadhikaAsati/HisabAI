
from app.schemas.planner import Product, ShopFinance

from app.schemas.planner import (
    Product,
    ShopFinance,
    PurchasePlanRequest,
    PurchaseRecommendation,
    PurchasePlanResponse,
)
from app.schemas.planner import (
    Product,
    ShopFinance,
    PurchasePlanRequest,
    PurchaseRecommendation,
    PurchasePlanResponse,
)

def calculate_days_of_stock(product: Product) -> float:
    """
    Calculate how many days the current stock is expected to last.
    """

    if product.average_daily_sales == 0:
        return float("inf")

    return product.current_stock / product.average_daily_sales

def needs_restock(
    product: Product,
    safety_buffer_days: int = 2,
) -> bool:
    """
    Check whether a product needs restocking.

    Restock when stock coverage is less than or equal
    to supplier lead time plus the safety buffer.
    """

    days_remaining = calculate_days_of_stock(product)

    restock_threshold = (
        product.supplier_lead_time_days + safety_buffer_days
    )

    return days_remaining <= restock_threshold

def calculate_order_quantity(
    product: Product,
    target_coverage_days: int = 3,
) -> int:
    """
    Calculate how many units are needed to reach
    the target stock coverage.
    """

    target_stock = (
        product.average_daily_sales * target_coverage_days
    )

    order_quantity = max(
        0,
        target_stock - product.current_stock,
    )

    return int(order_quantity)

def calculate_product_cost(
    product: Product,
    order_quantity: int,
) -> float:
    """Calculate the cost of ordering one product."""

    return order_quantity * product.purchase_price


def calculate_total_purchase_cost(
    products: list[Product],
) -> float:
    """Calculate the total cost of the recommended orders."""

    total_cost = 0.0

    for product in products:
        quantity = calculate_order_quantity(product)
        cost = calculate_product_cost(product, quantity)
        total_cost += cost

    return total_cost


def calculate_spendable_cash(
    finance: ShopFinance,
) -> float:
    """Calculate cash available for purchases after reserve."""

    return max(
        0.0,
        finance.available_cash - finance.cash_reserve,
    )

def is_purchase_affordable(
    total_cost: float,
    spendable_cash: float,
) -> bool:
    """Check whether the purchase fits within spendable cash."""

    return total_cost <= spendable_cash


def generate_purchase_plan(
    request: PurchasePlanRequest,
) -> PurchasePlanResponse:
    """
    Generate a purchase plan by prioritizing urgent products
    while staying within the spendable cash budget.
    """

    finance = request.finance
    spendable_cash = calculate_spendable_cash(finance)
    remaining_budget = spendable_cash

    recommendations = []

    # Step 1: Separate products that need restocking
    # from products that already have sufficient stock.
    urgent_products = []
    sufficient_stock_products = []

    for product in request.products:
        if needs_restock(product):
            urgent_products.append(product)
        else:
            sufficient_stock_products.append(product)

    # Step 2: Sort products by urgency.
    # Lower days-of-stock minus lead-time means more urgent.
    urgent_products.sort(
        key=lambda product: (
            calculate_days_of_stock(product)
            - product.supplier_lead_time_days
        )
    )

    # Step 3: Process urgent products first.
    for product in urgent_products:
        days_remaining = calculate_days_of_stock(product)

        # Calculate the full quantity needed.
        quantity = calculate_order_quantity(product)
        cost = calculate_product_cost(product, quantity)

        if cost <= remaining_budget:
            # Full purchase is affordable.
            status = "BUY"
            reason = "Restocking needed and within budget."
            remaining_budget -= cost
            final_quantity = quantity
            final_cost = cost

        else:
            # Full purchase is not affordable.
            # Check whether a smaller order is possible.
            affordable_quantity = int(
                remaining_budget // product.purchase_price
            )

            if affordable_quantity > 0:
                # Buy a smaller quantity within the budget.
                status = "BUY"
                final_quantity = min(
                    quantity,
                    affordable_quantity,
                )
                final_cost = calculate_product_cost(
                    product,
                    final_quantity,
                )
                reason = (
                    "Partial purchase recommended because "
                    "of limited budget."
                )
                remaining_budget -= final_cost

            else:
                # Not enough cash for even one unit.
                status = "POSTPONE"
                final_quantity = 0
                final_cost = 0.0
                reason = (
                    "Restocking needed, but budget is "
                    "insufficient for even one unit."
                )

        recommendations.append(
            PurchaseRecommendation(
                product_id=product.product_id,
                product_name=product.name,
                status=status,
                order_quantity=final_quantity,
                unit_price=product.purchase_price,
                total_cost=final_cost,
                days_of_stock=days_remaining,
                reason=reason,
            )
        )

    # Step 4: Add products that do not need restocking.
    for product in sufficient_stock_products:
        recommendations.append(
            PurchaseRecommendation(
                product_id=product.product_id,
                product_name=product.name,
                status="ENOUGH_STOCK",
                order_quantity=0,
                unit_price=product.purchase_price,
                total_cost=0.0,
                days_of_stock=calculate_days_of_stock(product),
                reason="Current stock is sufficient.",
            )
        )

    # Step 5: Calculate the financial summary.
    total_purchase_cost = spendable_cash - remaining_budget

    return PurchasePlanResponse(
        recommendations=recommendations,
        total_purchase_cost=total_purchase_cost,
        spendable_cash=spendable_cash,
        remaining_spendable_cash=remaining_budget,
        cash_after_purchase=finance.available_cash - total_purchase_cost,
        protected_reserve=finance.cash_reserve,
    )
