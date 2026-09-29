
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.sale import SaleDB
from app.models.purchase import PurchaseDB
from app.models.expense import ExpenseDB
from app.models.credit_payment import CreditPaymentDB

router = APIRouter(prefix="/cashflow", tags=["Cash Flow"])


@router.get("/")
def get_cashflow(db: Session = Depends(get_db)):

    # 1. Total revenue from all sales
    total_sales = (
        db.query(
            func.coalesce(func.sum(SaleDB.total_amount), 0)
        )
        .scalar()
    )

    # 2. Cash received from cash sales only
    cash_sales = (
        db.query(
            func.coalesce(func.sum(SaleDB.total_amount), 0)
        )
        .filter(SaleDB.payment_mode == "CASH")
        .scalar()
    )

    # 3. Revenue from credit sales
    credit_sales = (
        db.query(
            func.coalesce(func.sum(SaleDB.total_amount), 0)
        )
        .filter(SaleDB.payment_mode == "CREDIT")
        .scalar()
    )

    # 4. Payments received from customers against credit
    total_credit_payments = (
        db.query(
            func.coalesce(func.sum(CreditPaymentDB.amount), 0)
        )
        .scalar()
    )

    # 5. Total purchase spending
    total_purchases = (
        db.query(
            func.coalesce(func.sum(PurchaseDB.total_amount), 0)
        )
        .scalar()
    )

    # 6. Total expenses
    total_expenses = (
        db.query(
            func.coalesce(func.sum(ExpenseDB.amount), 0)
        )
        .scalar()
    )

    # 7. Calculate total cash received
    total_cash_inflow = (
        float(cash_sales)
        + float(total_credit_payments)
    )

    # 8. Calculate total recorded outflow
    total_cash_outflow = (
        float(total_purchases)
        + float(total_expenses)
    )

    # 9. Calculate net cash flow
    net_cash_flow = (
        total_cash_inflow - total_cash_outflow
    )

    return {
        "total_sales_revenue": float(total_sales),
        "cash_sales_received": float(cash_sales),
        "credit_sales_revenue": float(credit_sales),
        "customer_payments_received": float(total_credit_payments),
        "total_cash_inflow": total_cash_inflow,
        "total_purchase_spending": float(total_purchases),
        "total_expenses": float(total_expenses),
        "total_cash_outflow": total_cash_outflow,
        "net_cash_flow": net_cash_flow,
    }