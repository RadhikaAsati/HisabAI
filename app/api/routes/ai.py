from fastapi import APIRouter, Depends, HTTPException,File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_shop
from app.db.database import get_db
from app.models.product import ProductDB
from app.models.shop import ShopDB
from app.schemas.ai import (
     BillConfirmation,
     BillExtraction,
    TransactionExtraction,
    VoiceSaleConfirmation,
)
from app.schemas.billing import BillingCreate, BillingItem
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

@router.post("/scan-bill")
async def scan_bill(
    file: UploadFile = File(...),
    current_shop: ShopDB = Depends(get_current_shop),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image of the bill.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded bill is empty.",
        )

    try:
        extraction = ai_service.extract_bill(
            image_bytes=image_bytes,
            mime_type=file.content_type,
        )

        return {
            "filename": file.filename,
            "extraction": extraction,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract bill data: {str(error)}",
        )

@router.post("/scan-bill/confirm")
def confirm_scanned_bill(
    confirmation: BillConfirmation,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    try:
        # -----------------------------------------
        # Step 1: Validate customer if CREDIT
        # -----------------------------------------
        customer_id = None

        if confirmation.payment_mode == "CREDIT":
            customer = (
                db.query(CustomerDB)
                .filter(
                    CustomerDB.customer_id
                    == confirmation.customer_id,
                    CustomerDB.shop_id
                    == current_shop.shop_id,
                )
                .first()
            )

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found.",
                )

            customer_id = customer.customer_id

        # -----------------------------------------
        # Step 2: Match products to this shop
        # -----------------------------------------
        billing_items = []

        for item in confirmation.items:
            product = (
                db.query(ProductDB)
                .filter(
                    ProductDB.product_id == item.product_id,
                    ProductDB.shop_id == current_shop.shop_id,
                )
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found.",
                )

            billing_items.append(
                BillingItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_selling_price=item.unit_selling_price,
                )
            )

        # -----------------------------------------
        # Step 3: Build normal billing request
        # -----------------------------------------
        billing = BillingCreate(
            customer_id=customer_id,
            payment_mode=confirmation.payment_mode,
            items=billing_items,
        )

        # -----------------------------------------
        # Step 4: Reuse existing billing service
        # -----------------------------------------
        result = create_billing_transaction(
            db=db,
            billing=billing,
            current_shop=current_shop,
            customer_id=customer_id,
        )

        return {
            "message": "Scanned bill confirmed successfully.",
            "bill": result,
        }

    except HTTPException:
        db.rollback()
        raise

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        db.rollback()
        print("SCAN BILL CONFIRM ERROR:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Could not confirm scanned bill.",
        )