
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.sql import func

from app.db.database import Base


class PurchaseDB(Base):
    __tablename__ = "purchases"

    purchase_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    unit_purchase_price = Column(Float, nullable=False)

    total_amount = Column(Float, nullable=False)

    payment_status = Column(
        String,
        nullable=False,
        default="UNPAID"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )