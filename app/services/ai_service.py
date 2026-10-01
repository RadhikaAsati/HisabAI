import time

from google import genai
from google.genai import errors

from app.core.config import settings
from app.schemas.ai import TransactionExtraction
from app.models.product import ProductDB

class AIService:
    """
    Central service for communicating with Gemini.

    Gemini handles language understanding and extraction.
    Financial calculations and database changes stay in the backend.
    """

    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )

    def extract_transaction(self, text: str) -> TransactionExtraction:
        prompt = f"""
You are the bookkeeping extraction assistant for HisabAI.

The shopkeeper may speak in Hindi, Hinglish, or English.

Extract ONLY the transaction information explicitly stated by the shopkeeper.

Allowed transaction types:
- SALE
- PURCHASE
- EXPENSE

Rules:
- Do not invent missing values.
- If product name is not mentioned, return null.
- If quantity is not mentioned, return null.
- If amount is not mentioned, return null.
- For SALE, amount means the total selling amount mentioned.
- For PURCHASE, amount means the total purchase amount mentioned.
- For EXPENSE, use description for what the money was spent on.
- confidence must be between 0 and 1.
- Return only JSON matching the requested schema.

Shopkeeper statement:
{text}
"""

        for attempt in range(3):
            try:
                response = self.client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": TransactionExtraction,
                    },
                )

                return TransactionExtraction.model_validate_json(
                    response.text
                )

            except errors.ServerError as error:
                if error.code == 503 and attempt < 2:
                    time.sleep(2 * (attempt + 1))
                    continue

                raise

    def match_product(
        self,
        db: Session,
        shop_id: int,
        product_name: str,
    ):
        products = (
            db.query(ProductDB)
            .filter(
                ProductDB.shop_id == shop_id
            )
            .all()
        )

        search_name = product_name.strip().lower()

        for product in products:
            if product.name.strip().lower() == search_name:
                return product

        return None
ai_service = AIService()