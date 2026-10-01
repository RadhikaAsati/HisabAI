from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.models.customer import CustomerDB
from app.models.shop import ShopDB
from app.schemas.billing import BillingCreate, BillingResponse
from app.services.billing_service import create_billing_transaction


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
        customer_id = None

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

            customer_id = customer.customer_id

        # --------------------------------------------------
        # Step 2: Use shared billing service
        # --------------------------------------------------
        result = create_billing_transaction(
            db=db,
            billing=billing,
            current_shop=current_shop,
            customer_id=customer_id,
        )

        # --------------------------------------------------
        # Step 3: Return bill details
        # --------------------------------------------------
        return result

    except HTTPException:
        db.rollback()
        raise

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
            detail="Billing transaction could not be completed.",
        )