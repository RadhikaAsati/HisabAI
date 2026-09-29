
from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class SaleDB(Base):
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False,
    )

    quantity = Column(Integer, nullable=False)
    unit_selling_price = Column(Float, nullable=False)

    total_amount = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    payment_mode = Column(
        String,
        nullable=False,
        default="CASH",
    )