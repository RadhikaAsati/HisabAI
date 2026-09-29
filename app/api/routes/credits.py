
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.credit import CreditDB
from app.models.customer import CustomerDB
from app.schemas.credit import CreditCreate, CreditResponse

router = APIRouter(prefix="/credits", tags=["Credits"])


@router.post(
    "/",
    response_model=CreditResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_credit(
    credit: CreditCreate,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(CustomerDB)
        .filter(CustomerDB.customer_id == credit.customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    new_credit = CreditDB(
        customer_id=credit.customer_id,
        amount=credit.amount,
        paid_amount=0,
        description=credit.description,
    )

    db.add(new_credit)
    db.commit()
    db.refresh(new_credit)

    return new_credit


@router.get("/", response_model=list[CreditResponse])
def get_credits(db: Session = Depends(get_db)):
    return (
        db.query(CreditDB)
        .order_by(CreditDB.credit_id.desc())
        .all()
    )