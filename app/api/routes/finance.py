
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.shop_finance import ShopFinanceDB
from app.schemas.planner import ShopFinance

router = APIRouter(prefix="/finance", tags=["Shop Finance"])


@router.put("/", response_model=ShopFinance)
def save_finance(
    finance: ShopFinance,
    db: Session = Depends(get_db),
):
    """Save or update the shop's financial details."""

    saved_finance = db.query(ShopFinanceDB).filter(
        ShopFinanceDB.id == 1
    ).first()

    if saved_finance is None:
        saved_finance = ShopFinanceDB(id=1)
        db.add(saved_finance)

    saved_finance.available_cash = finance.available_cash
    saved_finance.pending_customer_payments = (
        finance.pending_customer_payments
    )
    saved_finance.cash_reserve = finance.cash_reserve

    db.commit()
    db.refresh(saved_finance)

    return saved_finance


@router.get("/", response_model=ShopFinance)
def get_finance(db: Session = Depends(get_db)):
    """Retrieve the shop's saved financial details."""

    saved_finance = db.query(ShopFinanceDB).filter(
        ShopFinanceDB.id == 1
    ).first()

    if saved_finance is None:
        raise HTTPException(
            status_code=404,
            detail="No financial details found. Please save them first.",
        )

    return saved_finance