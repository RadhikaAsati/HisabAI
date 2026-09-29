
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.models.expense import ExpenseDB
from app.schemas.expense import ExpenseCreate, ExpenseResponse


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
)


@router.post("/", response_model=ExpenseResponse, status_code=201)
def record_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
):
    try:
        # Step 1: Create the expense record
        new_expense = ExpenseDB(
            category=expense.category,
            description=expense.description,
            amount=expense.amount,
        )

        # Step 2: Save it in the database
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

        # Step 3: Return the saved expense
        return ExpenseResponse(
            expense_id=new_expense.expense_id,
            category=new_expense.category,
            description=new_expense.description,
            amount=new_expense.amount,
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to record expense",
        )


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
):
    expenses = (
        db.query(ExpenseDB)
        .order_by(ExpenseDB.created_at.desc())
        .all()
    )

    return [
        ExpenseResponse(
            expense_id=expense.expense_id,
            category=expense.category,
            description=expense.description,
            amount=expense.amount,
            created_at=expense.created_at,
        )
        for expense in expenses
    ]