from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB
from app.models.customer import CustomerDB
from app.models.shop import ShopDB
from app.models.shop_finance import ShopFinanceDB
from app.schemas.credit_payment import (
    CreditPaymentCreate,
    CreditPaymentResponse,
)
from app.api.dependencies import get_current_shop


router = APIRouter(
    prefix="/credits/payments",
    tags=["Credit Payments"],
)


# ============================================================
# CREATE CREDIT PAYMENT
# ============================================================

@router.post(
    "/",
    response_model=CreditPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payment: CreditPaymentCreate,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find the credit entry belonging to the current shop
    # --------------------------------------------------------
    credit = (
        db.query(CreditDB)
        .join(
            CustomerDB,
            CreditDB.customer_id == CustomerDB.customer_id,
        )
        .filter(
            CreditDB.credit_id == payment.credit_id,
            CustomerDB.shop_id == current_shop.shop_id,
        )
        .with_for_update()
        .first()
    )

    if not credit:
        raise HTTPException(
            status_code=404,
            detail="Credit entry not found",
        )

    # --------------------------------------------------------
    # Calculate remaining outstanding amount
    # --------------------------------------------------------
    outstanding = credit.amount - credit.paid_amount

    if payment.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than 0",
        )

    if payment.amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds outstanding balance of {outstanding}",
        )

    # --------------------------------------------------------
    # Create payment record
    # --------------------------------------------------------
    new_payment = CreditPaymentDB(
        credit_id=payment.credit_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
    )

    # --------------------------------------------------------
    # Reduce customer's outstanding udhaar
    # --------------------------------------------------------
    credit.paid_amount += payment.amount

    # --------------------------------------------------------
    # Add recovered udhaar to shop's available funds
    # --------------------------------------------------------
    finance = (
        db.query(ShopFinanceDB)
        .filter(
            ShopFinanceDB.shop_id == current_shop.shop_id,
        )
        .with_for_update()
        .first()
    )

    if finance is None:
        raise HTTPException(
            status_code=404,
            detail="Shop financial details not found",
        )

    finance.available_cash += payment.amount

    # --------------------------------------------------------
    # Save everything atomically
    # --------------------------------------------------------
    try:
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

    except Exception:
        db.rollback()
        raise

    return new_payment


# ============================================================
# GET ALL CREDIT PAYMENTS FOR CURRENT SHOP
# ============================================================

@router.get(
    "/",
    response_model=list[CreditPaymentResponse],
)
def get_payments(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    return (
        db.query(CreditPaymentDB)
        .join(
            CreditDB,
            CreditPaymentDB.credit_id == CreditDB.credit_id,
        )
        .join(
            CustomerDB,
            CreditDB.customer_id == CustomerDB.customer_id,
        )
        .filter(
            CustomerDB.shop_id == current_shop.shop_id,
        )
        .order_by(
            CreditPaymentDB.payment_id.desc()
        )
        .all()
    )