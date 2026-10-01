from sqlalchemy.orm import Session

from app.models.credit import CreditDB
from app.models.product import ProductDB
from app.models.sale import SaleDB
from app.models.shop import ShopDB
from app.schemas.billing import BillingCreate


def create_billing_transaction(
    db: Session,
    billing: BillingCreate,
    current_shop: ShopDB,
    customer_id: int | None = None,
):
    """
    Create a complete billing transaction.

    Handles:
    - Product ownership validation
    - Stock validation
    - Sale creation
    - Stock reduction
    - Credit creation when required

    Everything is committed as one database transaction.
    """

    # --------------------------------------------------
    # Step 1: Validate all products and stock
    # --------------------------------------------------
    products = {}

    for item in billing.items:
        product = (
            db.query(ProductDB)
            .filter(
                ProductDB.product_id == item.product_id,
                ProductDB.shop_id == current_shop.shop_id,
            )
            .with_for_update()
            .first()
        )

        if product is None:
            raise ValueError(
                f"Product {item.product_id} not found."
            )

        if product.current_stock < item.quantity:
            raise ValueError(
                f"Insufficient stock for {product.name}. "
                f"Available stock: {product.current_stock}"
            )

        products[item.product_id] = product

    # --------------------------------------------------
    # Step 2: Calculate bill
    # --------------------------------------------------
    response_items = []
    total_bill_amount = 0.0

    for item in billing.items:
        product = products[item.product_id]

        item_total = (
            item.quantity * item.unit_selling_price
        )

        total_bill_amount += item_total

        response_items.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_selling_price": item.unit_selling_price,
                "total_amount": item_total,
            }
        )

    # --------------------------------------------------
    # Step 3: Create sales and update stock
    # --------------------------------------------------
    for item in billing.items:
        product = products[item.product_id]

        sale = SaleDB(
            product_id=item.product_id,
            quantity=item.quantity,
            unit_selling_price=item.unit_selling_price,
            total_amount=(
                item.quantity * item.unit_selling_price
            ),
            payment_mode=billing.payment_mode,
        )

        product.current_stock -= item.quantity

        db.add(sale)

    # --------------------------------------------------
    # Step 4: Create credit if required
    # --------------------------------------------------
    credit_id = None

    if billing.payment_mode == "CREDIT":
        if customer_id is None:
            raise ValueError(
                "Customer is required for CREDIT billing."
            )

        credit = CreditDB(
            customer_id=customer_id,
            amount=total_bill_amount,
            paid_amount=0,
            description="Billing transaction",
        )

        db.add(credit)

        # Generate credit_id before commit
        db.flush()

        credit_id = credit.credit_id

    # --------------------------------------------------
    # Step 5: Commit everything together
    # --------------------------------------------------
    db.commit()

    return {
        "total_amount": total_bill_amount,
        "payment_mode": billing.payment_mode,
        "customer_id": customer_id,
        "items": response_items,
        "credit_id": credit_id,
    }