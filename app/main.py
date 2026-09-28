from fastapi import FastAPI
from app.api.routes.purchase import router as purchase_router
from app.api.routes.health import router as health_router
from app.api.routes import products

app = FastAPI(
    title="HisabAI API",
    description="Backend API for the HisabAI business companion.",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(purchase_router)
app.include_router(products.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to HisabAI API",
        "docs": "/docs",
    }