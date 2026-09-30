from sqlalchemy import Column, Integer, Float, ForeignKey

from app.db.database import Base


class ShopFinanceDB(Base):
    __tablename__ = "shop_finances"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    shop_id = Column(
        Integer,
        ForeignKey("shops.shop_id"),
        nullable=False,
        unique=True,
        index=True,
    )

    available_cash = Column(
        Float,
        nullable=False,
        default=0,
    )

    pending_customer_payments = Column(
        Float,
        nullable=False,
        default=0,
    )

    cash_reserve = Column(
        Float,
        nullable=False,
        default=0,
    )