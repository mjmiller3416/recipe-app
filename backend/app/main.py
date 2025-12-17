"""app/main.py

Main FastAPI application for Meal Genie.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import recipes, planner, shopping, ingredients, meals

# Create FastAPI app
app = FastAPI(
    title="Meal Genie API",
    description="Backend API for the Meal Genie recipe management and meal planning application",
    version="1.0.0",
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific origins
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
