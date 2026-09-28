
from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class ProductDB(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    current_stock = Column(Integer, nullable=False, default=0)
    average_daily_sales = Column(Float, nullable=False, default=0)
    purchase_price = Column(Float, nullable=False)
    supplier_lead_time_days = Column(Integer, nullable=False, default=0)