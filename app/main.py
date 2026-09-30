from fastapi import FastAPI
from app.api.routes.purchase import router as purchase_router
from app.api.routes.health import router as health_router
from app.api.routes import finance
from app.api.routes import products
from app.api.routes import sales
from app.api.routes import expenses
from app.db.database import create_tables
from app.api.routes import customers
from app.api.routes import credits
from app.api.routes import credit_payments

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
from app.api.routes import dashboard
from app.api.routes import cashflow
from app.api.routes import auth
from app.api.routes import billing

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

app = FastAPI(
    title="HisabAI API",
    description="Backend API for the HisabAI business companion.",
    version="0.1.0",
)

@app.on_event("startup")
def startup_event():
    create_tables()
app.include_router(sales.router)
app.include_router(health_router)
app.include_router(purchase_router)
app.include_router(products.router)
app.include_router(finance.router)
app.include_router(expenses.router)
app.include_router(customers.router)
app.include_router(credits.router)
app.include_router(credit_payments.router)
app.include_router(dashboard.router)
app.include_router(cashflow.router)
app.include_router(auth.router)
app.include_router(billing.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to HisabAI API",
        "docs": "/docs",
    }