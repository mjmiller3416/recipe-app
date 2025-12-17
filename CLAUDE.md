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
npx tsc              # TypeScript type checking
npx shadcn@latest add <component>  # Add shadcn/ui components
```

### Backend (from `backend/` directory)
```bash
# Windows (using venv)
venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Seed database with sample data
venv/Scripts/python.exe scripts/seed_database.py
```

### Environment Setup
- Backend: Copy `backend/.env.example` to `backend/.env`
- Frontend API URL: Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`)

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

**API Prefixes:** `/api/recipes`, `/api/planner`, `/api/shopping`, `/api/ingredients`

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
