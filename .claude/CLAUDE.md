# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

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

- `app/` - Next.js App Router (dashboard, recipes, meal-planner, shopping-list, settings, auth)
- `components/` - UI components organized by domain (ui/, auth/, common/, forms/, layout/, meal-genie/, recipe/, settings/)
- `hooks/api/` - React Query hooks for all API calls
- `lib/` - API client, utilities, constants, providers
- `types/` - TypeScript type definitions
- `proxy.ts` - Clerk auth middleware

### Key Patterns

**API Client** (`lib/api.ts`): All backend calls use typed API methods:
```typescript
// Centralized API client with methods for all backend services
import { recipeApi, plannerApi, shoppingApi, mealGenieApi, ... } from "@/lib/api";
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

## Authentication

- **Provider**: Clerk (configured in `proxy.ts`)
- **Client-side**: `lib/api-client.ts` injects Clerk tokens automatically
- **Server-side**: `lib/api-server.ts` for React Server Components
- **Protected routes**: Backend validates JWT tokens on all authenticated endpoints

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

## API Conventions

- All endpoints return standardized Pydantic DTOs
- Error responses follow FastAPI HTTPException patterns
- List endpoints support pagination via `skip`/`limit` parameters
- Dates stored as ISO 8601 strings (YYYY-MM-DD)

## Testing

**Backend**: pytest with fixtures in `tests/`
**Frontend**: Manual testing with dev server

## MCP Servers Available

- `shadcn` - Search and add shadcn/ui components
- `next-devtools` - Next.js MCP tools (requires dev server running)
- `cloudinary-asset-mgmt` - Image upload and management
- `claude-code-docs` - Access Claude Code documentation

## Claude Code Skills & Commands

### ⚠️ Automatic Context System (Hook-Based)

**Context is loaded automatically via hooks when you edit files. No manual action needed.**

The project uses **command-based hooks** (fast shell scripts, not agents) to load context automatically:

**Hook Lifecycle:**
1. **SessionStart** (on compaction) → Re-inject critical reminders
2. **PreToolUse** (before Edit/Write) → Load relevant context modules
3. **PostToolUse** (after Edit/Write) → Audit design system compliance
4. **Stop** → Verify work completion

**Context Modules** (`.claude/context/`):
- **Frontend**: frontend-core, design-tokens, shadcn-patterns, component-patterns, form-patterns, layout-patterns, accessibility, file-organization
- **Backend**: backend-core, architecture, models, repositories, services, dtos, routes, migrations, exceptions

**Performance**: 1 shell script per edit (~<1s) vs 3 agent spawns (~90s)

**Requirements**: jq (JSON parser) and Git Bash (Windows)

For detailed troubleshooting and configuration, see [.claude/HOOKS.md](.claude/HOOKS.md)

### Specialized Agents

- `recipe-app-explorer` - Search agent optimized for this codebase (knows domain models, architecture patterns, common files)

### Commands

- `/git` - Git workflow automation (start, commit, sync, merge, deploy, pr)
- `/todo` - Generate TODO items
- `/changelog` - Generate changelog entries

## Deployment

Uses Railway with Dockerfiles in `frontend/` and `backend/` directories. Configuration in `railway.json`.
