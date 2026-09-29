
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.customer import CustomerDB
from app.schemas.customers import CustomerCreate, CustomerResponse

from sqlalchemy import func
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
):
    if customer.phone:
        existing_customer = (
            db.query(CustomerDB)
            .filter(CustomerDB.phone == customer.phone)
            .first()
        )

        if existing_customer:
            raise HTTPException(
                status_code=409,
                detail="A customer with this phone number already exists",
            )

    new_customer = CustomerDB(
        name=customer.name.strip(),
        phone=customer.phone,
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("/", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(CustomerDB).order_by(CustomerDB.customer_id).all()


@router.get("/balances/")
def get_customer_balances(db: Session = Depends(get_db)):
    customers = db.query(CustomerDB).all()

    balances = []

    for customer in customers:
        total_credit = (
            db.query(func.coalesce(func.sum(CreditDB.amount), 0))
            .filter(CreditDB.customer_id == customer.customer_id)
            .scalar()
        )

        total_paid = (
            db.query(
                func.coalesce(func.sum(CreditPaymentDB.amount), 0)
            )
            .join(
                CreditDB,
                CreditPaymentDB.credit_id == CreditDB.credit_id,
            )
            .filter(CreditDB.customer_id == customer.customer_id)
            .scalar()
        )

        outstanding = float(total_credit) - float(total_paid)

        balances.append({
            "customer_id": customer.customer_id,
            "name": customer.name,
            "phone": customer.phone,
            "total_credit": float(total_credit),
            "total_paid": float(total_paid),
            "outstanding_balance": outstanding,
        })

    return balances