# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meal Genie - A recipe management and meal planning application with a Python/FastAPI backend and Next.js/React frontend.

## Development Commands

### Frontend (from `frontend/` directory)
```bash
npm run dev          # Start dev server (binds to 0.0.0.0:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript type checking (no output)
npx shadcn@latest add <component>  # Add shadcn/ui components
```

### Backend (from `backend/` directory)
```bash
# Windows (using venv)
venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Run tests
venv/Scripts/python.exe -m pytest tests/ -v               # Run all tests
venv/Scripts/python.exe -m pytest tests/test_meal_and_planner.py -v  # Run specific test file

# Database migrations (Alembic)
venv/Scripts/alembic.exe upgrade head      # Apply all migrations
venv/Scripts/alembic.exe revision --autogenerate -m "description"  # Create new migration

# Database seeding/clearing
venv/Scripts/python.exe scripts/seed_database.py                    # Clear and reseed all data (default)
venv/Scripts/python.exe scripts/seed_database.py --clear-only       # Clear all data without reseeding
venv/Scripts/python.exe scripts/seed_database.py --mode append      # Add to existing data
venv/Scripts/python.exe scripts/seed_database.py --recipes-only     # Only seed recipes (skip meals/shopping)
venv/Scripts/python.exe scripts/seed_database.py --count 10         # Seed specific number of recipes
venv/Scripts/python.exe scripts/seed_database.py --verbose          # Show detailed output
```

### Environment Setup
- Backend: Copy `backend/.env.example` to `backend/.env`
- Frontend API URL: Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`)
- Optional: `CLOUDINARY_*` for image uploads, `GEMINI_API_KEY` for AI image generation

## Architecture

### Backend (`backend/`)
Clean architecture with separation of concerns:

```
backend/app/
├── main.py              # FastAPI app with CORS, routes at /api/*
├── api/                 # Route handlers (recipes, planner, shopping, ingredients)
├── core/
│   ├── models/          # SQLAlchemy ORM models
│   ├── repositories/    # Database access layer
│   ├── services/        # Business logic layer
│   ├── dtos/            # Pydantic DTOs for request/response validation
│   └── database/        # SQLite connection, migrations (Alembic)
```

**API Prefixes:** `/api/recipes`, `/api/meals`, `/api/planner`, `/api/shopping`, `/api/ingredients`, `/api/data-management`, `/api/upload`

### Frontend (`frontend/`)
Next.js 16 with App Router, React 19, Tailwind CSS 4:

```
frontend/src/
├── app/                 # Next.js pages (recipes/, meal-planner/, shopping-list/, settings/)
├── components/
│   ├── ui/              # shadcn/ui components (new-york style)
│   ├── common/          # Shared components
│   ├── forms/           # Form components with validation
│   ├── recipe/          # Recipe-specific components
│   └── layout/          # Layout components
├── lib/
│   ├── api.ts           # Centralized API client (recipeApi, plannerApi, shoppingApi, ingredientApi)
│   ├── formValidation.ts # Form validation utilities
│   └── utils.ts         # General utilities
├── types/index.ts       # All TypeScript DTOs matching backend
└── hooks/               # Custom hooks (useSettings, useUnsavedChanges)
```

### Key Integration Pattern
- Backend DTOs in `backend/app/core/dtos/*.py` mirror frontend types in `frontend/src/types/index.ts`
- Frontend API client (`src/lib/api.ts`) wraps all backend endpoints with typed methods
- API errors handled via `ApiError` class with status codes and details

### Database
- SQLite by default at `backend/app/core/database/app_data.db`
- PostgreSQL supported via `SQLALCHEMY_DATABASE_URL` env var
- Alembic for migrations in `backend/app/core/database/migrations/`

## UI Components
Uses shadcn/ui (new-york style) with Lucide icons. Components installed to `src/components/ui/`. Import path alias: `@/components/ui/<component>`.

## Documentation
Comprehensive documentation available in `docs/`:
- `docs/INDEX.md` - Quick reference for all API endpoints, models, and components
- `docs/BACKEND_DOCUMENTATION.md` - Detailed backend architecture and API
- `docs/FRONTEND_DOCUMENTATION.md` - Frontend components and utilities
- `docs/INTEGRATION.md` - Frontend/backend integration patterns
