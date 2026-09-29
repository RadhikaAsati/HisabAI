
from sqlalchemy import Column, Integer, String

from app.db.database import Base


class CustomerDB(Base):
    __tablename__ = "customers"

    customer_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    name = Column(String, nullable=False)

    phone = Column(
        String,
        unique=True,
        nullable=True
    )