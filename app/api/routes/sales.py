from sqlalchemy import desc, func
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import ProductDB
from app.models.sale import SaleDB
from app.models.shop import ShopDB
from app.schemas.sales import SaleCreate, SaleResponse
from app.api.dependencies import get_current_shop

router = APIRouter(prefix="/sales", tags=["Sales"])


# -----------------------------------
# POST /sales/ - Record a new sale
# -----------------------------------
@router.post("/", response_model=SaleResponse)
def record_sale(
    sale: SaleCreate,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # Step 1: Find the product belonging to the current shop
    product = (
        db.query(ProductDB)
        .filter(
            ProductDB.product_id == sale.product_id,
            ProductDB.shop_id == current_shop.shop_id,
        )
        .with_for_update()
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    # Step 2: Check stock availability
    if product.current_stock < sale.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available stock: {product.current_stock}",
        )

    # Step 3: Calculate total sale amount
    total_amount = sale.quantity * sale.unit_selling_price

    # Step 4: Create the sale record
    new_sale = SaleDB(
        product_id=sale.product_id,
        quantity=sale.quantity,
        unit_selling_price=sale.unit_selling_price,
        total_amount=total_amount,
        payment_mode=sale.payment_mode,
    )

    # Step 5: Reduce product stock
    product.current_stock -= sale.quantity

    # Step 6: Save changes
    try:
        db.add(new_sale)
        db.commit()
        db.refresh(new_sale)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Sale could not be recorded.",
        )

    # Step 7: Return sale details
    return {
        "sale_id": new_sale.sale_id,
        "product_id": new_sale.product_id,
        "product_name": product.name,
        "quantity": new_sale.quantity,
        "unit_selling_price": new_sale.unit_selling_price,
        "total_amount": new_sale.total_amount,
        "payment_mode": new_sale.payment_mode,
        "created_at": new_sale.created_at,
    }


# -----------------------------------
# GET /sales/ - Get current shop's sales
# -----------------------------------
@router.get("/", response_model=list[SaleResponse])
def get_sales(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    sales = (
        db.query(SaleDB, ProductDB.name.label("product_name"))
        .join(
            ProductDB,
            SaleDB.product_id == ProductDB.product_id,
        )
        .filter(
            ProductDB.shop_id == current_shop.shop_id,
        )
        .order_by(desc(SaleDB.created_at))
        .all()
    )

    return [
        {
            "sale_id": sale.sale_id,
            "product_id": sale.product_id,
            "product_name": product_name,
            "quantity": sale.quantity,
            "unit_selling_price": sale.unit_selling_price,
            "total_amount": sale.total_amount,
            "payment_mode": sale.payment_mode,
            "created_at": sale.created_at,
        }
        for sale, product_name in sales
    ]


# -----------------------------------
# GET /sales/summary - Current shop sales summary
# -----------------------------------
@router.get("/summary")
def get_sales_summary(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # Calculate total revenue and quantity sold
    totals = (
        db.query(
            func.sum(SaleDB.total_amount),
            func.sum(SaleDB.quantity),
        )
        .join(
            ProductDB,
            SaleDB.product_id == ProductDB.product_id,
        )
        .filter(
            ProductDB.shop_id == current_shop.shop_id,
        )
        .first()
    )

    total_revenue = totals[0] or 0
    total_quantity = totals[1] or 0

    # Calculate sales separately for each product
    product_sales = (
        db.query(
            ProductDB.product_id,
            ProductDB.name,
            func.sum(SaleDB.quantity).label("quantity_sold"),
            func.sum(SaleDB.total_amount).label("revenue"),
        )
        .join(
            SaleDB,
            ProductDB.product_id == SaleDB.product_id,
        )
        .filter(
            ProductDB.shop_id == current_shop.shop_id,
        )
        .group_by(
            ProductDB.product_id,
            ProductDB.name,
        )
        .all()
    )

    return {
        "total_revenue": total_revenue,
        "total_quantity_sold": total_quantity,
        "product_wise_sales": [
            {
                "product_id": row.product_id,
                "product_name": row.name,
                "quantity_sold": row.quantity_sold,
                "revenue": row.revenue,
            }
            for row in product_sales
        ],
    }