
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.shop_finance import ShopFinanceDB
from app.models.sale import SaleDB
from app.models.purchase import PurchaseDB
from app.models.expense import ExpenseDB
from app.models.credit import CreditDB
from app.models.credit_payment import CreditPaymentDB

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    finance = db.query(ShopFinanceDB).filter(
        ShopFinanceDB.id == 1
    ).first()

    total_sales = (
        db.query(func.coalesce(func.sum(SaleDB.total_amount), 0))
        .scalar()
    )

    total_purchases = (
        db.query(func.coalesce(func.sum(PurchaseDB.total_amount), 0))
        .scalar()
    )

    total_expenses = (
        db.query(func.coalesce(func.sum(ExpenseDB.amount), 0))
        .scalar()
    )

    total_credit = (
        db.query(func.coalesce(func.sum(CreditDB.amount), 0))
        .scalar()
    )

    total_paid = (
        db.query(func.coalesce(func.sum(CreditPaymentDB.amount), 0))
        .scalar()
    )

    outstanding_credit = float(total_credit) - float(total_paid)

    return {
        "available_cash": (
            float(finance.available_cash) if finance else 0.0
        ),
        "total_sales": float(total_sales),
        "total_purchases": float(total_purchases),
        "total_expenses": float(total_expenses),
        "total_customer_credit": float(total_credit),
        "total_customer_payments": float(total_paid),
        "outstanding_credit": outstanding_credit,
    }