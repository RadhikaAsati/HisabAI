
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg://localhost:5432/hisabai"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def create_tables():
    from app.models.product import ProductDB
    from app.models.purchase_receipt import PurchaseReceiptDB
    from app.models.shop_finance import ShopFinanceDB
    from app.models.sale import SaleDB
    from app.models.purchase import PurchaseDB
    from app.models.expense import ExpenseDB
    from app.models.customer import CustomerDB
    from app.models.credit import CreditDB
    from app.models.credit_payment import CreditPaymentDB

    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()