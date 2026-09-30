from sqlalchemy import Column, Integer, String, ForeignKey

from app.db.database import Base


class CustomerDB(Base):
    __tablename__ = "customers"

    customer_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    shop_id = Column(
        Integer,
        ForeignKey("shops.shop_id"),
        nullable=True,
        index=True,
    )

    name = Column(String, nullable=False)

    phone = Column(
        String,
        nullable=False,
        index=True,
    )