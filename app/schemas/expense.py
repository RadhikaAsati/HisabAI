
from pydantic import BaseModel, Field
from datetime import datetime

class ExpenseCreate(BaseModel):
    category: str = Field(min_length=1)
    description: str | None = None
    amount: float = Field(gt=0)

class ExpenseResponse(BaseModel):
    expense_id: int
    category: str
    description: str | None
    amount: float
    created_at: datetime
