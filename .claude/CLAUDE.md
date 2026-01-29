# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meal Genie** is a full-stack recipe management and meal planning application with AI-powered features. It consists of:

- **Frontend**: Next.js 16 + React 19 with TypeScript, Tailwind CSS v4, shadcn/ui (New York style)
- **Backend**: FastAPI + SQLAlchemy 2.0 with Pydantic v2, SQLite (dev) / PostgreSQL (prod)
- **AI**: Google Gemini integration for recipe generation, cooking tips, meal suggestions, and image generation

## Development Commands

### Frontend (from `frontend/`)

```bash
npm run dev          # Start dev server on 0.0.0.0:3000
npm run build        # Production build
npm run lint         # ESLint
npx tsc              # TypeScript type checking
npx shadcn@latest add <component>  # Add shadcn/ui component
```

### Backend (from `backend/`)

```bash
# Activate virtual environment first
venv\Scripts\activate                          # Windows
source venv/bin/activate                       # Linux/macOS

# Run development server
python -m uvicorn app.main:app --reload --port 8000

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Seed sample data
python app/scripts/seed_database.py --mode replace

# Run tests
pytest
pytest tests/test_file.py -v
```

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Frontend API URL (default: `http://localhost:8000`)
- `SQLALCHEMY_DATABASE_URL` - Backend DB URL (default: SQLite)
- `GEMINI_ASSISTANT_API_KEY` - For Meal Genie chat
- `GEMINI_TIP_API_KEY` - For cooking tips
- `GEMINI_IMAGE_API_KEY` - For image generation
- `CLOUDINARY_*` - For image uploads

## Architecture

### Backend Layered Architecture

```
API Routes (app/api/)
    ↓
Services (app/services/)    # Business logic
    ↓
Repositories (app/repositories/)    # Data access
    ↓
Models (app/models/)    # SQLAlchemy ORM
```

- **DTOs** (`app/dtos/`): Pydantic models for request/response validation
- **AI Module** (`app/ai/`): Separate directory with configs, DTOs, and services for all AI features
- **Database** (`app/database/`): Connection setup and Alembic migrations

### Frontend Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard with widgets
│   ├── recipes/            # Recipe browser, detail, add/edit
│   ├── meal-planner/       # Meal planning with drag-and-drop
│   ├── shopping-list/      # Auto-generated shopping lists
│   ├── settings/           # User preferences
│   ├── sign-in/            # Clerk sign-in
│   └── sign-up/            # Clerk sign-up
├── components/
│   ├── ui/                 # shadcn/ui base components (26)
│   ├── auth/               # Authentication (SignIn, SignUp, UserMenu)
│   ├── common/             # Shared components (FilterBar, StatsCard, etc.)
│   ├── forms/              # Form components (QuantityInput, SmartIngredientInput)
│   ├── layout/             # App layout (sidebar, nav, page header, mobile nav)
│   ├── meal-genie/         # AI chat interface
│   ├── recipe/             # Recipe-specific components
│   └── settings/           # Settings section (DataManagementSection)
├── data/                   # Static data (changelog)
├── hooks/                  # Custom React hooks
│   └── api/                # React Query hooks for all API calls
├── lib/                    # Utilities, API client, constants
│   └── providers/          # React Query provider
├── types/                  # TypeScript type definitions
└── proxy.ts                # Clerk auth middleware
```

### Key Patterns

**API Client** (`lib/api.ts`): All backend calls use typed API methods:
```typescript
import { recipeApi, plannerApi, shoppingApi, mealGenieApi, dashboardApi, ingredientApi, dataManagementApi, uploadApi, imageGenerationApi, cookingTipApi, mealSuggestionsApi, feedbackApi, unitConversionApi, settingsApi } from "@/lib/api";
```

**API Authentication Layer**:
- `lib/api-client.ts`: Client-side authenticated fetch with Clerk token injection
- `lib/api-server.ts`: Server-side authenticated fetch for RSC

**State Management**:
- Server state: React Query (hooks in `hooks/api/`)
- Local state: React useState
- Persisted state: Custom hooks with localStorage (`useSettings`, `useChatHistory`, `useRecentRecipes`)

**Form Components**: Use shadcn/ui components with the design system tokens. Never hardcode colors.

## Design System (CRITICAL)

This project has an extensive design system. **Always follow these rules**:

1. **Use shadcn/ui components** - Never create fake cards, buttons, or badges with raw divs
2. **Use semantic color tokens** - `text-muted-foreground`, `bg-card`, `border-border` (not `text-gray-500`)
3. **Use Tailwind scale** - `h-10`, `gap-4` (not `h-[38px]`, `gap-[15px]`)
4. **Icon buttons need aria-label** - `<Button size="icon" aria-label="Close">`
5. **Loading states required** - Buttons show spinner + disabled during async actions

**Quick Reference - When to use what**:
| Need | Use |
|------|-----|
| Card container | `<Card>` from `@/components/ui/card` |
| Button | `<Button variant="..." size="...">` |
| Badge/status | `<Badge variant="...">` |
| Form input | `<Input>`, `<Select>`, `<Textarea>` from ui/ |
| Icon | Lucide React with `strokeWidth={1.5}` |

## Key Domain Models

### Backend Models
- **Recipe** - Full recipe with ingredients, directions, images (reference + banner)
- **Meal** - Composition of main recipe + up to 3 side recipes
- **PlannerEntry** - Meal in the weekly planner (max 15 entries)
- **ShoppingItem** - Shopping list item with recipe source tracking

### Frontend Types
- **RecipeCardDTO** / **RecipeCardData** - Lightweight recipe for lists
- **MealSelectionResponseDTO** - Meal with hydrated recipes
- **PlannerEntryResponseDTO** - Planner entry with meal data
- **ShoppingMode** - "all" | "produce_only" | "none"

## Constraints & Limits

| Feature | Limit |
|---------|-------|
| Planner entries | 15 max |
| Side recipes per meal | 3 max |
| Meal tags | 20 max, 50 chars each |
| Recipe/Ingredient name | 255 chars |

## MCP Servers Available

- `shadcn` - Search and add shadcn/ui components
- `next-devtools` - Next.js MCP tools (requires dev server running)
- `cloudinary-asset-mgmt` - Image upload and management

## Claude Code Skills & Commands

### Skill Documentation (Auto-Read)

**Frontend Design** (`.claude/skills/frontend-design/`):
- [SKILL.md](.claude/skills/frontend-design/SKILL.md) - Design skill overview

**Backend Development** (`.claude/skills/backend-dev/`):
- [SKILL.md](.claude/skills/backend-dev/SKILL.md) - Quick reference and patterns

**Git Workflow** (`.claude/skills/git/`):
- [SKILL.md](.claude/skills/git/SKILL.md) - Branch naming, commit message, and PR conventions

### Commands

These commands in `.claude/commands/` are **only run when explicitly invoked**:

- `/frontend` - Frontend design automation (scaffold, audit, lookup, add)
- `/backend` - Backend architecture automation (scaffold, audit, migrate, test)
- `/git` - Git workflow automation (start, commit, sync, merge, deploy, pr)
- `/todo` - Generate TODO items
- `/changelog` - Generate changelog entries
- `/sync-issues` - Sync GitHub issues to TODOs

## Deployment

Uses Railway with Dockerfiles in `frontend/` and `backend/` directories. Configuration in `railway.json`.