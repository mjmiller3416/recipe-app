# Authentication Testing Guide

This guide covers how to properly test the multi-user authentication system locally before deploying to production.

## Table of Contents

- [The Problem](#the-problem)
- [Quick Start](#quick-start)
- [Authentication Modes](#authentication-modes)
- [Testing Workflow](#testing-workflow)
- [Debugging Authentication](#debugging-authentication)
- [Pre-Deploy Checklist](#pre-deploy-checklist)
- [Common Issues & Solutions](#common-issues--solutions)

---

## The Problem

By default, the backend runs with `AUTH_DISABLED=true`, which bypasses all JWT validation and returns a hardcoded dev user. This is fast for development but **hides authentication bugs**.

| Local (AUTH_DISABLED=true) | Production (AUTH_DISABLED=false) |
|---------------------------|----------------------------------|
| No token validation | Full JWT verification via Clerk |
| Always returns user ID 1 | Requires valid Clerk token |
| Can't catch auth bugs | Real authentication flow |

**Result:** Code works locally but breaks in production.

---

## Quick Start

```bash
# 1. Switch to production-like authentication
python backend/scripts/toggle_auth.py prod

# 2. Restart the backend (required after .env changes)
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 3. Run frontend (in another terminal)
cd frontend
npm run dev

# 4. Sign in through Clerk at http://localhost:3000/sign-in

# 5. Test your changes

# 6. Switch back to dev mode when done (optional)
python backend/scripts/toggle_auth.py dev
```

---

## Authentication Modes

### Toggle Script

```bash
# Check current mode
python backend/scripts/toggle_auth.py

# Enable dev mode (bypass auth - fast local development)
python backend/scripts/toggle_auth.py dev

# Enable prod mode (real auth - test like production)
python backend/scripts/toggle_auth.py prod
```

### Manual Configuration

Edit `backend/.env`:

```env
# Dev mode - bypass authentication
AUTH_DISABLED=true
DEV_USER_ID=1

# Prod mode - real authentication
AUTH_DISABLED=false
```

> **Important:** Always restart the backend after changing `.env`

---

## Testing Workflow

### 1. Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Sign In

1. Navigate to `http://localhost:3000`
2. You should be redirected to `/sign-in`
3. Sign in with your Clerk test account
4. After successful sign-in, you'll be redirected to `/dashboard`

### 3. Test Protected Routes

These routes require authentication:

| Route | What to Test |
|-------|--------------|
| `/recipes` | Recipe list loads with your recipes |
| `/recipes/[id]` | Single recipe view works |
| `/meal-planner` | Planner entries load |
| `/shopping-list` | Shopping list generates |
| `/dashboard` | Dashboard stats load |

### 4. Verify Token Flow

Open **Browser DevTools → Network tab** and check API requests:

✅ **Good Request:**
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

Response: 200 OK
```

❌ **Bad Request (missing token):**
```
Request Headers:
  (no Authorization header)

Response: 401 Unauthorized
  {"detail": "Missing authentication token"}
```

---

## Debugging Authentication

### Backend Logs

The backend prints detailed auth logs. Watch for these patterns:

```
[AUTH] auth_disabled=False, has_credentials=True    ← Token received
[AUTH] Token received, length=xxx
[JWKS] Fetching from: https://...clerk.accounts.dev/.well-known/jwks.json
[JWKS] SUCCESS - cached 1 keys
[AUTH] Found signing key: kid=ins_xxx
[AUTH] JWT decoded successfully, sub=user_xxx       ← Success!
[AUTH] Extracted: clerk_id=user_xxx, email=xxx@xxx.com, name=John
```

### Common Log Patterns

| Log Message | Meaning | Solution |
|-------------|---------|----------|
| `No credentials provided` | Frontend not sending token | Check `useRecipes()` hook usage |
| `Unable to find signing key` | JWKS mismatch | Check Clerk keys match frontend/backend |
| `Token missing required claim: email` | Clerk JWT missing email | Configure Clerk JWT template |
| `Invalid authentication token` | JWT expired or malformed | Sign out and sign in again |

### Frontend Debugging

Check if Clerk is providing tokens:

```typescript
// Add temporarily to any component
import { useAuth } from "@clerk/nextjs";

const { getToken, isSignedIn } = useAuth();

// In a useEffect or button handler:
const token = await getToken();
console.log("Signed in:", isSignedIn);
console.log("Token:", token ? `${token.slice(0, 50)}...` : "null");
```

---

## Pre-Deploy Checklist

Run through this checklist before deploying authentication changes:

### 1. Local Testing (Prod Mode)

- [ ] Switch to prod mode: `python backend/scripts/toggle_auth.py prod`
- [ ] Restart backend server
- [ ] Sign in through Clerk on localhost
- [ ] Verify no 401 errors in browser console

### 2. Test Critical Flows

- [ ] **Sign In:** Can sign in via `/sign-in`
- [ ] **Recipe Browser:** `/recipes` loads recipes
- [ ] **Recipe Detail:** `/recipes/[id]` shows full recipe
- [ ] **Favorites:** Can toggle favorite (heart icon)
- [ ] **Meal Planner:** `/meal-planner` loads entries
- [ ] **Shopping List:** `/shopping-list` generates correctly
- [ ] **Sign Out:** Can sign out and is redirected

### 3. Network Verification

- [ ] All API requests have `Authorization: Bearer` header
- [ ] No 401/403 responses for authenticated users
- [ ] Backend logs show successful JWT decode

### 4. Edge Cases

- [ ] **Expired session:** Sign in, wait, refresh - should re-authenticate
- [ ] **Invalid token:** Manually corrupt token in DevTools - should get 401
- [ ] **New user:** Sign up new account - user created in database

### 5. Multi-User Isolation

- [ ] Sign in as User A, create a recipe
- [ ] Sign out, sign in as User B
- [ ] User B should NOT see User A's recipe
- [ ] Each user sees only their own data

---

## Common Issues & Solutions

### Issue: 401 "Missing authentication token"

**Cause:** Frontend not sending the Authorization header.

**Solution:** Ensure components use the React Query hooks from `@/hooks/api/`:
```typescript
// ❌ Wrong - no token
const data = await recipeApi.list();

// ✅ Correct - token injected automatically
const { data } = useRecipes();
```

### Issue: 401 "Token missing required claim: email"

**Cause:** Clerk's default JWT doesn't include email.

**Solution:** Configure a JWT Template in Clerk Dashboard:
1. Go to Clerk Dashboard → JWT Templates
2. Create new template or edit default
3. Add to claims: `"email": "{{user.primary_email_address}}"`

### Issue: 503 "Authentication service unavailable"

**Cause:** Backend can't reach Clerk's JWKS endpoint.

**Solution:**
- Check internet connection
- Verify `CLERK_PUBLISHABLE_KEY` is correct
- Check for firewall/proxy issues

### Issue: Works locally in prod mode, breaks when deployed

**Cause:** Environment variables not set in deployment.

**Solution:** Verify Railway/deployment has:
- `CLERK_PUBLISHABLE_KEY` (same as frontend)
- `CLERK_SECRET_KEY`
- `AUTH_DISABLED` is NOT set (defaults to false)

### Issue: CORS errors in browser

**Cause:** Backend not allowing frontend origin.

**Solution:** Check `app/main.py` CORS configuration includes your frontend URL.

---

## Architecture Reference

### Token Flow

```
┌─────────────────────────────────────┐
│  Frontend (Next.js + Clerk)         │
├─────────────────────────────────────┤
│  1. User signs in via Clerk UI      │
│  2. Clerk issues JWT token          │
│  3. useAuth().getToken() retrieves  │
│  4. React Query hooks attach token  │
│  5. fetch() sends Authorization     │
└─────────────────────────────────────┘
              ↓ Bearer token
┌─────────────────────────────────────┐
│  Backend (FastAPI)                  │
├─────────────────────────────────────┤
│  1. Extract Authorization header    │
│  2. Fetch Clerk's JWKS (cached 1hr) │
│  3. Verify JWT signature (RS256)    │
│  4. Extract claims (sub, email)     │
│  5. Get/create user in database     │
│  6. Inject user into route handler  │
└─────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/hooks/api/useRecipes.ts` | React Query hooks with token injection |
| `frontend/src/lib/api.ts` | API client, accepts optional token |
| `backend/app/api/dependencies.py` | JWT verification, user extraction |
| `backend/app/core/auth_config.py` | Clerk configuration settings |
| `backend/scripts/toggle_auth.py` | Toggle dev/prod auth mode |

---

## Quick Commands Reference

```bash
# Check auth mode
python backend/scripts/toggle_auth.py

# Test like production
python backend/scripts/toggle_auth.py prod

# Fast local development
python backend/scripts/toggle_auth.py dev

# Watch backend logs (look for [AUTH] messages)
python -m uvicorn app.main:app --reload --port 8000

# TypeScript check frontend
cd frontend && npx tsc --noEmit
```
