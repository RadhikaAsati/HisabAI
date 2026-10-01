from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.models.product import ProductDB
from app.models.shop import ShopDB
from app.schemas.ai import (
    TransactionExtraction,
    VoiceSaleConfirmation,
)
from app.schemas.billing import BillingCreate
from app.services.ai_service import ai_service
from app.services.billing_service import create_billing_transaction

router = APIRouter(prefix="/ai", tags=["AI"])


class AITextRequest(BaseModel):
    text: str


@router.post("/voice-entry")
def voice_entry(
    request: AITextRequest,
    db: Session = Depends(get_db),
    current_shop: ShopDB = Depends(get_current_shop),
):
    extraction = ai_service.extract_transaction(request.text)

    matched_product = None

    if extraction.product_name:
        matched_product = ai_service.match_product(
            db=db,
            shop_id=current_shop.shop_id,
            product_name=extraction.product_name,
        )

    return {
        "extraction": extraction,
        "product_match": (
            {
                "product_id": matched_product.product_id,
                "name": matched_product.name,
                "current_stock": matched_product.current_stock,
                "purchase_price": matched_product.purchase_price,
            }
            if matched_product
            else None
        ),
    }


@router.post("/voice-entry/confirm")
def confirm_voice_sale(
    confirmation: VoiceSaleConfirmation,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------
    # Step 1: Validate quantity
    # --------------------------------------------------
    if confirmation.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero.",
        )

    # --------------------------------------------------
    # Step 2: Validate total amount
    # --------------------------------------------------
    if confirmation.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Total amount must be greater than zero.",
        )

    # --------------------------------------------------
    # Step 3: Calculate selling price per unit
    # --------------------------------------------------
    unit_selling_price = (
        confirmation.total_amount / confirmation.quantity
    )

    # --------------------------------------------------
    # Step 4: Build the existing billing request
    # --------------------------------------------------
    billing = BillingCreate(
        payment_mode=confirmation.payment_mode,
        customer_id=None,
        items=[
            {
                "product_id": confirmation.product_id,
                "quantity": confirmation.quantity,
                "unit_selling_price": unit_selling_price,
            }
        ],
    )

    # --------------------------------------------------
    # Step 5: Use the shared billing service
    # --------------------------------------------------
    try:
        result = create_billing_transaction(
            db=db,
            billing=billing,
            current_shop=current_shop,
        )

        return {
            "message": "Voice sale confirmed successfully.",
            "product_id": confirmation.product_id,
            "quantity": confirmation.quantity,
            "unit_selling_price": unit_selling_price,
            "total_amount": result["total_amount"],
            "payment_mode": result["payment_mode"],
            "remaining_stock": (
                db.query(ProductDB)
                .filter(
                    ProductDB.product_id == confirmation.product_id,
                    ProductDB.shop_id == current_shop.shop_id,
                )
                .first()
                .current_stock
            ),
        }

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Voice sale could not be completed.",
        )