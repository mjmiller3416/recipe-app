"""app/main.py

Main FastAPI application for Meal Genie.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import dashboard, data_management, feedback, meals, planner, recipes, shopping, ingredients, upload, unit_conversions
from app.api.ai import cooking_tips_router, meal_genie_router, image_generation_router

# Create FastAPI app
app = FastAPI(
    title="Meal Genie API",
    description="Backend API for the Meal Genie recipe management and meal planning application",
    version="1.0.0",
)

# Get allowed origins from environment or use wildcard for development
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(planner.router, prefix="/api/planner", tags=["planner"])
app.include_router(shopping.router, prefix="/api/shopping", tags=["shopping"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["ingredients"])
app.include_router(data_management.router, prefix="/api/data-management", tags=["data-management"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(unit_conversions.router, prefix="/api/unit-conversions", tags=["unit-conversions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# AI-powered services (consolidated under /api/ai/)
app.include_router(cooking_tips_router, prefix="/api/ai/cooking-tip", tags=["ai", "cooking-tips"])
app.include_router(meal_genie_router, prefix="/api/ai/meal-genie", tags=["ai", "meal-genie"])
app.include_router(image_generation_router, prefix="/api/ai/image-generation", tags=["ai", "image-generation"])


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Meal Genie API is running",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Optional: Serve static files for images if needed
# Uncomment and adjust path if you want to serve images from the backend
# static_path = Path(__file__).parent.parent / "static"
# if static_path.exists():
#     app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
