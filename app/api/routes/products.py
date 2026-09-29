import csv
import io

from fastapi import UploadFile, File
from pydantic import ValidationError

from app.schemas.planner import Product
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import ProductDB
from app.models.purchase_receipt import PurchaseReceiptDB
from app.schemas.planner import Product

router = APIRouter(prefix="/products", tags=["Products"])


class ReceiveStockRequest(BaseModel):
    confirmation_id: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)


@router.post("/", response_model=Product)
def create_product(product: Product, db: Session = Depends(get_db)):
    existing_product = db.query(ProductDB).filter(
        ProductDB.product_id == product.product_id
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="Product ID already exists."
        )

    db_product = ProductDB(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=list[Product])
def get_products(db: Session = Depends(get_db)):
    return db.query(ProductDB).order_by(ProductDB.product_id).all()


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: int,
    updated_product: Product,
    db: Session = Depends(get_db),
):
    product = db.query(ProductDB).filter(
        ProductDB.product_id == product_id
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

    for field, value in updated_product.model_dump().items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(ProductDB).filter(
        ProductDB.product_id == product_id
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

    return {"message": "Product deleted successfully.", "product_id": product_id}


@router.post("/{product_id}/receive", response_model=Product)
def receive_stock(
    product_id: int,
    request: ReceiveStockRequest,
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
        ProductDB.product_id == product_id
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

    # 4. Find products that already exist
    existing_ids = {
        product_id
        for (product_id,) in (
            db.query(ProductDB.product_id)
            .filter(ProductDB.product_id.in_(seen_ids))
            .all()
        )
    }

    # 5. Add only new products
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