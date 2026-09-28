
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import ProductDB
from app.schemas.planner import Product

router = APIRouter(prefix="/products", tags=["Products"])


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