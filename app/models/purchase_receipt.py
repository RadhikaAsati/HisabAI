
from sqlalchemy import Column, String, Integer, ForeignKey
from app.db.database import Base


class PurchaseReceiptDB(Base):
    __tablename__ = "purchase_receipts"

    confirmation_id = Column(String, primary_key=True)
    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False,
    )
    quantity = Column(Integer, nullable=False)