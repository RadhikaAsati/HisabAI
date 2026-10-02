from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import create_tables

from app.api.routes.health import router as health_router
from app.api.routes.purchase import router as purchase_router
from app.api.routes import ai
from app.api.routes import (
    sales,
    products,
    finance,
    expenses,
    customers,
    credits,
    credit_payments,
    dashboard,
    cashflow,
    auth,
    billing,
)


app = FastAPI(
    title="HisabAI API",
    description="Backend API for the HisabAI business companion.",
    version="0.1.0",
)


# =========================================================
# CORS
# =========================================================
#
# The frontend runs separately from the FastAPI backend:
#
# Frontend:
#   http://localhost:5173
#   or
#   http://127.0.0.1:5173
#
# CORS allows the browser to safely make requests
# from the frontend to the backend.
#
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://hisab-ai-coral.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():
    create_tables()


# =========================================================
# API ROUTES
# =========================================================

app.include_router(health_router)
app.include_router(purchase_router)

app.include_router(sales.router)
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
app.include_router(ai.router)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to HisabAI API",
        "docs": "/docs",
    }