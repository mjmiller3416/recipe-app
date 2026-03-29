"""app/main.py

Main FastAPI application for Meal Genie.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import api_router

# Create FastAPI app
app = FastAPI(
    title="Meal Genie API",
    description="Backend API for the Meal Genie recipe management and meal planning application",
    version="1.0.0",
)

# Get allowed origins from environment or use wildcard for development
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# CORS spec forbids wildcard origin with credentials — only enable
# credentials when specific origins are configured
allow_credentials = CORS_ORIGINS != ["*"]

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(api_router)


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
