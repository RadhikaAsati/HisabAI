
from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class CreditPaymentDB(Base):
    __tablename__ = "credit_payments"

    payment_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    credit_id = Column(
        Integer,
        ForeignKey("credits.credit_id"),
        nullable=False,
    )

    amount = Column(Float, nullable=False)

    payment_method = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )