
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB
from app.schemas.credit_payment import (
    CreditPaymentCreate,
    CreditPaymentResponse,
)

router = APIRouter(
    prefix="/credits/payments",
    tags=["Credit Payments"],
)


@router.post(
    "/",
    response_model=CreditPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payment: CreditPaymentCreate,
    db: Session = Depends(get_db),
):
    credit = (
        db.query(CreditDB)
        .filter(CreditDB.credit_id == payment.credit_id)
        .with_for_update()
        .first()
    )

    if not credit:
        raise HTTPException(
            status_code=404,
            detail="Credit entry not found",
        )

    outstanding = credit.amount - credit.paid_amount

    if payment.amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds outstanding balance of {outstanding}",
        )

    new_payment = CreditPaymentDB(
        credit_id=payment.credit_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
    )

    credit.paid_amount += payment.amount

    try:
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
    except Exception:
        db.rollback()
        raise

    return new_payment


@router.get(
    "/",
    response_model=list[CreditPaymentResponse],
)
def get_payments(db: Session = Depends(get_db)):
    return (
        db.query(CreditPaymentDB)
        .order_by(CreditPaymentDB.payment_id.desc())
        .all()
    )