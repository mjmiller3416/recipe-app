# Multi-User Transition Plan

## Overview
Transform the app from single-user to multi-user public access. This requires authentication, data isolation, and migrating settings from localStorage to server-side storage.

**Estimated Effort:** 3-5 weeks
**Risk Level:** Medium-High (data isolation is critical)

---

## Phase 1: Authentication System

### 1.1 Choose & Configure Auth Provider
- [ ] Evaluate options: Clerk vs NextAuth.js vs Supabase Auth
- [ ] Set up auth provider account and project
- [ ] Install auth packages in frontend
- [ ] Configure environment variables

### 1.2 Frontend Auth Implementation
- [ ] Add auth provider wrapper to `layout.tsx`
- [ ] Create `/login` page
- [ ] Create `/signup` page
- [ ] Create `/profile` page (or use provider's built-in)
- [ ] Add protected route wrapper/middleware
- [ ] Update navigation to show login/logout/user avatar
- [ ] Handle auth state in React context

### 1.3 Backend Auth Middleware
- [ ] Install JWT/auth validation library for FastAPI
- [ ] Create `get_current_user` dependency
- [ ] Create auth middleware to validate tokens
- [ ] Add CORS updates for auth headers
- [ ] Create `/api/auth/me` endpoint to verify session

---

## Phase 2: Database Schema Changes

### 2.1 Create User Model
- [ ] Add `User` model to `/backend/app/models/`
  - id (UUID)
  - external_auth_id (from auth provider)
  - email
  - name
  - avatar_url
  - created_at
  - updated_at

### 2.2 Add user_id Foreign Keys
- [ ] Add `user_id` FK to `Recipe` model
- [ ] Add `user_id` FK to `Meal` model
- [ ] Add `user_id` FK to `PlannerEntry` model
- [ ] Add `user_id` FK to `ShoppingItem` model
- [ ] Add `user_id` FK to `RecipeHistory` model

### 2.3 Create User Settings Table
- [ ] Add `UserSettings` model
  - user_id (FK)
  - settings_json (store all settings as JSON)
  - updated_at

### 2.4 Database Migration
- [ ] Create Alembic migration for User table
- [ ] Create Alembic migration for user_id columns
- [ ] Create migration for UserSettings table
- [ ] Write data migration script for existing data (assign to default user or handle fresh start)

---

## Phase 3: API Authorization

### 3.1 Update Services Layer
- [ ] Update `RecipeService` to accept and filter by `user_id`
- [ ] Update `MealService` to accept and filter by `user_id`
- [ ] Update `PlannerService` to accept and filter by `user_id`
- [ ] Update `ShoppingService` to accept and filter by `user_id`
- [ ] Update `DashboardService` to filter stats by `user_id`

### 3.2 Update API Routes
- [ ] Add `current_user` dependency to all protected routes
- [ ] Update `/api/recipes` endpoints
- [ ] Update `/api/meals` endpoints
- [ ] Update `/api/planner` endpoints
- [ ] Update `/api/shopping` endpoints
- [ ] Update `/api/dashboard` endpoint
- [ ] Update `/api/history` endpoints

### 3.3 Create User Settings API
- [ ] Create `GET /api/settings` endpoint
- [ ] Create `PUT /api/settings` endpoint
- [ ] Create `UserSettingsService`

---

## Phase 4: Frontend Integration

### 4.1 API Client Updates
- [ ] Update API client to include auth token in headers
- [ ] Add token refresh logic (if using JWTs)
- [ ] Handle 401 responses (redirect to login)
- [ ] Add loading states for auth checks

### 4.2 Settings Migration
- [ ] Update `useSettings` hook to fetch from API
- [ ] Add server sync on settings change
- [ ] Keep theme in localStorage (instant load, no flash)
- [ ] Handle offline/fallback gracefully
- [ ] Migrate existing localStorage settings on first login

### 4.3 Protected Routes
- [ ] Wrap app routes in auth check
- [ ] Create public landing page (if needed)
- [ ] Redirect unauthenticated users to login
- [ ] Redirect authenticated users from login to app

---

## Phase 5: Testing & Security

### 5.1 Security Audit
- [ ] Verify no data leaks between users (CRITICAL)
- [ ] Test that user A cannot access user B's recipes
- [ ] Test that user A cannot access user B's meal plans
- [ ] Test that user A cannot access user B's shopping list
- [ ] Verify API returns 403/404 for unauthorized access
- [ ] Test auth token expiration handling

### 5.2 Integration Testing
- [ ] Test signup flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test logout and session cleanup
- [ ] Test settings persistence across sessions
- [ ] Test data creation as new user
- [ ] Test existing user data migration

### 5.3 Edge Cases
- [ ] Handle deleted users (cascade or soft delete?)
- [ ] Handle account linking (multiple auth providers)
- [ ] Test concurrent sessions
- [ ] Test password reset flow (if applicable)

---

## Phase 6: Deployment Considerations

### 6.1 Infrastructure
- [ ] Migrate from SQLite to PostgreSQL (recommended for production)
- [ ] Set up proper database backups
- [ ] Configure auth provider for production domain
- [ ] Set up environment variables in production

### 6.2 Data Migration Strategy
- [ ] Decide: fresh start vs migrate existing data
- [ ] If migrating: create "legacy" user or prompt existing users to create accounts
- [ ] Document migration runbook

---

## Decisions Needed

1. **Auth Provider Choice**
   - Clerk: Easiest, best DX, has costs at scale
   - NextAuth.js: Free, more setup, very flexible
   - Supabase Auth: Good if also using Supabase DB

2. **Shared vs Per-User Data**
   - Ingredients: Keep global (shared master list) ✓
   - Unit conversions: Keep global ✓
   - Everything else: Per-user

3. **Existing Data**
   - Option A: Fresh start (easiest)
   - Option B: Assign to a default user
   - Option C: Prompt to "claim" existing data on first signup

4. **Database**
   - Keep SQLite for simplicity?
   - Migrate to PostgreSQL for production scale?

---

## Files That Will Be Modified

### Backend (Python/FastAPI)
- `backend/app/models/` - Add User, UserSettings, update all models
- `backend/app/api/` - All route files need auth
- `backend/app/services/` - All services need user_id filtering
- `backend/app/database/` - Migrations
- `backend/app/main.py` - Auth middleware

### Frontend (Next.js/React)
- `frontend/src/app/layout.tsx` - Auth provider
- `frontend/src/app/` - New auth pages
- `frontend/src/hooks/useSettings.ts` - API-based settings
- `frontend/src/lib/api.ts` - Auth headers
- `frontend/src/components/` - Navigation updates

---

## Notes
- Start with Phase 1 (Auth) as it unblocks everything else
- Phase 2 and 3 can be done in parallel by different developers
- Do NOT skip Phase 5 testing - data leaks are unacceptable
- Consider feature flags to gradually roll out

---