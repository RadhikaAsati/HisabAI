from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.models.credit import CreditDB
from app.models.customer import CustomerDB
from app.models.product import ProductDB
from app.models.sale import SaleDB
from app.models.shop import ShopDB
from app.schemas.billing import BillingCreate, BillingResponse

router = APIRouter(
    prefix="/billing",
    tags=["Billing"],
)


@router.post(
    "/",
    response_model=BillingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bill(
    billing: BillingCreate,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    try:
        # --------------------------------------------------
        # Step 1: Validate customer for CREDIT billing
        # --------------------------------------------------
        customer = None

        if billing.payment_mode == "CREDIT":
            customer = (
                db.query(CustomerDB)
                .filter(
                    CustomerDB.customer_id == billing.customer_id,
                    CustomerDB.shop_id == current_shop.shop_id,
                )
                .first()
            )

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found.",
                )

        # --------------------------------------------------
        # Step 2: Validate all products and stock first
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
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found.",
                )

            if product.current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient stock for {product.name}. "
                        f"Available stock: {product.current_stock}"
                    ),
                )

            products[item.product_id] = product

        # --------------------------------------------------
        # Step 3: Calculate bill and prepare sale records
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
        # Step 4: Create SaleDB records and update stock
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
        # Step 5: Create one credit record if needed
        # --------------------------------------------------
        credit_id = None

        if billing.payment_mode == "CREDIT":
            credit = CreditDB(
                customer_id=billing.customer_id,
                amount=total_bill_amount,
                paid_amount=0,
                description="Billing transaction",
            )

            db.add(credit)

            # Flush so we get the generated credit_id
            db.flush()

            credit_id = credit.credit_id

        # --------------------------------------------------
        # Step 6: Commit the complete transaction
        # --------------------------------------------------
        db.commit()

        # --------------------------------------------------
        # Step 7: Return bill details
        # --------------------------------------------------
        return {
            "total_amount": total_bill_amount,
            "payment_mode": billing.payment_mode,
            "customer_id": billing.customer_id,
            "items": response_items,
            "credit_id": credit_id,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Billing transaction could not be completed.",
        )