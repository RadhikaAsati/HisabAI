
from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class ExpenseDB(Base):
    __tablename__ = "expenses"

    expense_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    category = Column(String, nullable=False)

    description = Column(String, nullable=True)

    amount = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )