
from sqlalchemy import text
from app.db.database import engine


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database()")
        )

        database_name = result.scalar()

        assert database_name == "hisabai"