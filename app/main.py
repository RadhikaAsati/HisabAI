from fastapi import FastAPI

from app.api.routes.health import router as health_router

app = FastAPI(
    title="HisabAI API",
    description="Backend API for the HisabAI business companion.",
    version="0.1.0",
)

app.include_router(health_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to HisabAI API",
        "docs": "/docs",
    }