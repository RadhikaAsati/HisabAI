
from sqlalchemy import inspect
from app.db.database import create_tables, engine


def test_products_table_exists():
    create_tables()

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    assert "products" in tables