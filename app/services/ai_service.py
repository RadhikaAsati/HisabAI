import time

from google import genai
from google.genai import errors
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.product import ProductDB
from app.schemas.ai import (
    BillExtraction,
    TransactionExtraction,
)


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

    def extract_transaction(
        self,
        text: str,
    ) -> TransactionExtraction:
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

    def extract_bill(
        self,
        image_bytes: bytes,
        mime_type: str,
    ) -> BillExtraction:
        prompt = """
You are extracting structured data from a shop bill or invoice.

Extract ONLY information that is explicitly visible in the image.

Rules:
- Do not invent missing values.
- Extract supplier name if visible.
- Extract customer name if visible.
- Extract invoice number if visible.
- Extract invoice date if visible.
- Extract every clearly identifiable product line.
- Extract product name, quantity, unit price, and line total when explicitly shown.
- Extract grand total only if explicitly visible.
- If a field is not visible or cannot be determined, use null where allowed.
- Do not calculate or guess missing financial values.
- Return only JSON matching the provided schema.
- Confidence must be between 0 and 1.
"""

        response = self.client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=[
                prompt,
                genai.types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type,
                ),
            ],
            config={
                "response_mime_type": "application/json",
                "response_schema": BillExtraction,
            },
        )

        return BillExtraction.model_validate_json(
            response.text
        )


ai_service = AIService()