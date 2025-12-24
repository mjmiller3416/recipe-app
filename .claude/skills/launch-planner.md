# Launch Planner

Transform app ideas into shippable MVPs. Stay focused, ship fast, validate with real users.

## Usage

```
/launch-planner [command] [idea or context]
```

**Commands:**
- `prd [idea]` - Generate a lean PRD from an idea
- `scope [feature]` - Evaluate if a feature belongs in MVP
- `starter [idea]` - Create a Claude Code starter prompt
- `check` - Review current progress and refocus on shipping
- `decide [question]` - Get product decision advice

## Core Philosophy

**Ship fast. Validate with real users. No feature creep.**

These are non-negotiable principles:

1. **Speed over perfection** - A shipped MVP teaches more than a perfect spec
2. **Users over assumptions** - Real feedback beats imagined requirements
3. **Simplicity over features** - Every feature is a liability until proven valuable
4. **Learning over building** - The goal is validation, not a product showcase

## Tech Stack

All MVPs use this stack unless there's a compelling reason not to:

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js (App Router) | Fast iteration, good DX, easy deployment |
| Backend | Next.js API Routes + Supabase | No separate backend to maintain |
| Database | Supabase (Postgres) | Auth, DB, storage in one place |
| Deployment | Vercel | Zero-config, instant deploys, free tier |
| Styling | Tailwind CSS | Rapid UI development |

## Pre-Build Questions (Mandatory)

Before writing ANY code, answer these three questions:

### 1. Who is this for?
- Describe one specific person (not a demographic)
- What's their current frustration?
- Where do they hang out online?

### 2. What's the ONE problem it solves?
- One sentence, no "and"s
- If you can't explain it simply, you don't understand it
- "It helps people..." is not specific enough

### 3. How will I know if it works?
- Define a specific success metric
- What user behavior proves value?
- Set a 2-week validation goal

**If you can't answer these clearly, stop. Go talk to potential users first.**

## MVP Scoping Rules

### The Core User Loop Test

Every feature must serve the core user loop:

```
User arrives → Experiences core value → Returns (or pays)
```

Ask: "Does this feature directly enable someone to experience the core value?"
- **YES** → Consider including
- **NO** → Cut it. No exceptions.

### The One-Week Rule

**Nothing in MVP takes more than 1 week to build.**

If a feature estimate exceeds one week:
1. Break it into smaller pieces
2. Find a simpler solution
3. Use a third-party service
4. Cut it from MVP entirely

### What's Always OUT of MVP

- User profiles (unless core to value prop)
- Settings pages
- Admin dashboards
- Email notifications
- Social features (sharing, commenting)
- Analytics dashboards for users
- Multiple user roles
- Onboarding flows (just explain in UI)
- Password reset (use magic links)
- Premium/paid tiers (validate free first)

### What's Always IN (if applicable)

- The one core action users came for
- Basic error handling (things shouldn't break silently)
- Mobile-responsive design
- Clear CTA on landing page
- Way to collect user feedback (simple form or email link)

## Common Mistakes to Avoid

### 1. Building features nobody asked for
**The trap:** "Users will definitely want this!"
**Reality:** You don't know what users want until they tell you.
**Fix:** Launch with less. Add features when users request them multiple times.

### 2. Over-engineering
**The trap:** "Let's build it right the first time with proper architecture."
**Reality:** You'll rewrite it anyway once you learn what users actually need.
**Fix:** Write simple, readable code. Refactor later when you have real requirements.

### 3. Adding auth before validating the idea
**The trap:** "We need accounts so users can save their data."
**Reality:** If nobody wants the core product, accounts are worthless.
**Fix:** Launch without auth first. Use local storage or anonymous sessions. Add auth when users ask for it.

### 4. Endless polish before launch
**The trap:** "Let me just fix this one more thing..."
**Reality:** Polishing is procrastination disguised as productivity.
**Fix:** Set a launch date. Ship on that date no matter what.

### 5. Building for scale before you have users
**The trap:** "This needs to handle millions of users."
**Reality:** You have zero users. That's the problem to solve.
**Fix:** Build for 100 users. Scaling problems are good problems to have.

---

## PRD Generation

When generating a PRD from an idea, use this exact format:

---

### [Product Name] - MVP PRD

**One-liner:** [What it does in one sentence]

**Target User:** [Specific person description]

**Core Problem:** [The one pain point being solved]

**Success Metric:** [How we know it's working]

---

#### Core User Loop

1. User [does what]
2. System [provides what value]
3. User [gets what outcome]

---

#### MVP Feature Set

| Feature | Purpose | Complexity | Include? |
|---------|---------|------------|----------|
| [Feature 1] | [Why needed] | [Low/Med] | YES |
| [Feature 2] | [Why needed] | [Low/Med] | YES |
| [Feature 3] | [Why needed] | [Med/High] | NO - Phase 2 |

---

#### NOT Building (Phase 2+)

- [Feature] - Why it's cut
- [Feature] - Why it's cut

---

#### Technical Approach

- **Frontend:** Next.js App Router
- **Backend:** Supabase
- **Key integrations:** [Any APIs needed]
- **Auth approach:** [None / Magic Links / OAuth]

---

#### Launch Checklist

- [ ] Core feature works end-to-end
- [ ] Landing page explains value prop
- [ ] Feedback collection mechanism exists
- [ ] Deployed to Vercel
- [ ] Shared with 5+ potential users

---

#### 2-Week Validation Plan

**Week 1:** Launch to [specific community/channel], collect feedback
**Week 2:** Iterate based on feedback, track [success metric]
**Go/No-go decision:** If [metric threshold], continue building

---

## Claude Code Starter Prompts

When creating a starter prompt for Claude Code, use this format:

```markdown
## Project: [Name]

Build an MVP for [one-line description].

### Tech Stack
- Next.js 14 (App Router)
- Supabase (auth + database)
- Tailwind CSS
- Deploy to Vercel

### Core Feature
[Describe the ONE thing this app does]

### User Flow
1. User lands on homepage
2. [Step 2]
3. [Step 3]
4. [Outcome]

### Database Schema
[Simple schema - usually 1-3 tables max]

### Pages Needed
- `/` - Landing + core functionality
- [Only add pages that are essential]

### What We're NOT Building
- [Explicitly list cut features]

### Success Criteria
- [ ] User can [core action]
- [ ] Works on mobile
- [ ] Deployed and shareable
```

---

## Product Decision Framework

When advising on product decisions, always filter through:

1. **Does this help us ship faster?**
   - If no: Default to skipping it

2. **Will real users tell us if this matters?**
   - If yes: Ship without it, let users ask for it

3. **Is this solving a real problem or an imagined one?**
   - If imagined: Cut it

4. **Am I building this because it's fun or because users need it?**
   - If fun: Be honest. Maybe cut it.

5. **What's the simplest possible version?**
   - Build that first. Always.

---

## Refocus Prompts

When running `/launch-planner check`, ask:

1. What have you shipped in the last 48 hours?
2. What's blocking you from shipping today?
3. Are you building something a user asked for, or something you assumed they want?
4. What's the ONE thing you need to finish to consider MVP done?
5. When is your hard launch deadline?

**If you've been "almost done" for more than 3 days, you're avoiding shipping. Launch what you have.**

---

## Mantras

Repeat these when you're tempted to over-build:

- "Will a user notice this? Will they pay for it?"
- "What's the laziest way to validate this?"
- "I can always add it later. I can't get back time spent on features nobody wanted."
- "Shipped beats perfect. Always."
- "My job is to learn, not to build."

---

## Red Flags You're Off Track

- You're building a "settings" page
- You're debating database architecture for more than 30 minutes
- You've added a third table to your schema
- You're writing tests before you have users
- You're "refactoring for cleanliness"
- You haven't shown anyone the product this week
- You keep saying "one more feature, then I'll launch"

**When you spot these: STOP. Ship what you have. Get feedback. Then decide what's next.**
