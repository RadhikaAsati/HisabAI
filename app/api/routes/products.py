import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import ProductDB
from app.models.purchase_receipt import PurchaseReceiptDB
from app.models.shop import ShopDB
from app.schemas.planner import Product
from app.api.dependencies import get_current_shop


router = APIRouter(prefix="/products", tags=["Products"])


class ReceiveStockRequest(BaseModel):
    confirmation_id: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)


@router.post("/", response_model=Product)
def create_product(
    product: Product,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    existing_product = db.query(ProductDB).filter(
        ProductDB.product_id == product.product_id,
        ProductDB.shop_id == current_shop.shop_id,
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="Product ID already exists in this shop."
        )

    db_product = ProductDB(
        **product.model_dump(),
        shop_id=current_shop.shop_id,
    )

    db.add(db_product)

    try:
        db.commit()
        db.refresh(db_product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Product ID already exists."
        )

    return db_product


@router.get("/", response_model=list[Product])
def get_products(
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    return (
        db.query(ProductDB)
        .filter(ProductDB.shop_id == current_shop.shop_id)
        .order_by(ProductDB.product_id)
        .all()
    )


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    updated_product: Product,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    product = db.query(ProductDB).filter(
        ProductDB.product_id == product_id,
        ProductDB.shop_id == current_shop.shop_id,
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    if updated_product.product_id != product_id:
        raise HTTPException(
            status_code=400,
            detail="Product ID in the request must match the URL."
        )

    product.name = updated_product.name
    product.current_stock = updated_product.current_stock
    product.average_daily_sales = updated_product.average_daily_sales
    product.purchase_price = updated_product.purchase_price
    product.supplier_lead_time_days = updated_product.supplier_lead_time_days

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    product = db.query(ProductDB).filter(
        ProductDB.product_id == product_id,
        ProductDB.shop_id == current_shop.shop_id,
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    existing_receipts = db.query(PurchaseReceiptDB).filter(
        PurchaseReceiptDB.product_id == product_id
    ).first()

    if existing_receipts:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this product because it has purchase receipt records."
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully.",
        "product_id": product_id,
    }


@router.post("/{product_id}/receive", response_model=Product)
def receive_stock(
    product_id: int,
    request: ReceiveStockRequest,
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    """Record a stock receipt exactly once per confirmation ID."""

    existing_receipt = db.query(PurchaseReceiptDB).filter(
        PurchaseReceiptDB.confirmation_id == request.confirmation_id
    ).first()

    if existing_receipt:
        raise HTTPException(
            status_code=409,
            detail="This purchase confirmation has already been recorded."
        )

    product = db.query(ProductDB).filter(
        ProductDB.product_id == product_id,
        ProductDB.shop_id == current_shop.shop_id,
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    product.current_stock += request.quantity

    receipt = PurchaseReceiptDB(
        confirmation_id=request.confirmation_id,
        product_id=product_id,
        quantity=request.quantity,
    )

    db.add(receipt)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This purchase confirmation has already been recorded."
        )

    db.refresh(product)

    return product


@router.post("/import")
def import_products(
    file: UploadFile = File(...),
    current_shop: ShopDB = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    # 1. Check the file type
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    # 2. Read the uploaded CSV
    try:
        content = file.file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(content))
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="The CSV file must use UTF-8 encoding."
        )

    required_columns = {
        "product_id",
        "name",
        "current_stock",
        "average_daily_sales",
        "purchase_price",
        "supplier_lead_time_days",
    }

    if not reader.fieldnames or not required_columns.issubset(
        set(reader.fieldnames)
    ):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain these columns: {sorted(required_columns)}"
        )

    rows = list(reader)

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="The CSV file contains no product rows."
        )

    # 3. Validate products and detect duplicate IDs in the file
    validated_products = []
    seen_ids = set()

    for row_number, row in enumerate(rows, start=2):
        try:
            product = Product.model_validate(row)
        except ValidationError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data on CSV row {row_number}: {exc.errors()}"
            )

        if product.product_id in seen_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate product ID {product.product_id} in CSV."
            )

        seen_ids.add(product.product_id)
        validated_products.append(product)

    # 4. Find products that already exist IN THIS SHOP
    existing_ids = {
        product_id
        for (product_id,) in (
            db.query(ProductDB.product_id)
            .filter(
                ProductDB.product_id.in_(seen_ids),
                ProductDB.shop_id == current_shop.shop_id,
            )
            .all()
        )
    }

    # 5. Add only new products to THIS SHOP
    imported_names = []
    skipped_names = []

    try:
        for product in validated_products:
            if product.product_id in existing_ids:
                skipped_names.append(product.name)
                continue

            db.add(
                ProductDB(
                    product_id=product.product_id,
                    shop_id=current_shop.shop_id,
                    name=product.name,
                    current_stock=product.current_stock,
                    average_daily_sales=product.average_daily_sales,
                    purchase_price=product.purchase_price,
                    supplier_lead_time_days=product.supplier_lead_time_days,
                )
            )

            imported_names.append(product.name)

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Import failed. No new products were saved."
        )

    # 6. Return the import summary
    return {
        "message": "Inventory import completed.",
        "imported_count": len(imported_names),
        "imported_products": imported_names,
        "skipped_count": len(skipped_names),
        "skipped_products": skipped_names,
    }