# Full-Stack Project — Claude Instructions

## Core rule: one step at a time
Never jump ahead. Complete the current step, confirm with me, then move to the next.
If I ask for step 3, do step 3 only — don't pre-emptively do 4 and 5.

---

## Who I am
- Backend-leaning engineer (Python, FastAPI, asyncio, PostgreSQL)
- Comfortable with Docker, Redis, React
- Preference: simple over clever (grug brain — complexity is the enemy)
- I learn by doing — give me something runnable, not just theory

---

## How to work with me
- **Concept first** (2-4 sentences), then implementation
- **Correct me immediately** if I'm wrong — don't let it slide
- **No over-engineering** — don't add abstractions I didn't ask for
- **No placeholder code** — if you write it, it should work
- **Ask one check question** after each step before moving on
- If something has tradeoffs, name them briefly — don't hide them

---

## Stack (this project)

| Layer | Tech |
|-------|------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL — Docker locally, Railway in production |
| ORM + Migrations | SQLAlchemy + Alembic |
| Frontend | Vite + React |
| Auth | FastAPI JWT (bcrypt + python-jose) |
| Infrastructure | Docker Compose for local dev |
| Frontend deploy | Cloudflare Pages |
| Backend deploy | Fly.io |

---

## Agents and skills — when to use what

### Planning a feature or system
- Use `architect` agent — design API contracts + DB schema before any code
- Use `planner` agent — sequence implementation steps from a plan doc
- Use `/api-design` skill — validate REST shape (resources, status codes, error format)

### Writing backend
- Use `/python-patterns` skill for FastAPI
- Use `/api-design` skill before writing any new route

### Writing database code
- Use `/postgres-patterns` skill for schema + queries
- Use `database-reviewer` agent before running any migration

### Writing frontend
- Use `/coding-standards` skill for React patterns

### Infrastructure
- Use `/docker-patterns` skill for Compose setup, networking, volumes

### After writing code
- Use `code-reviewer` agent on every non-trivial diff
- Use `python-reviewer` agent for all Python changes
- Use `/simplify` skill to catch over-engineering
- Use `build-error-resolver` agent when build breaks — don't debug manually

---

## Step-by-step feature workflow

```
Step 1 — architect agent      : design API contract + DB schema, identify gaps
Step 2 — /api-design          : validate REST shape before writing routes
Step 3 — write backend        : one endpoint or one module at a time
Step 4 — database-reviewer    : review migrations before applying
Step 5 — write frontend       : one component or hook at a time
Step 6 — code-reviewer        : review the diff
Step 7 — /simplify            : catch any over-engineering
```

Don't skip steps. Don't bundle steps.

---

## API design rules (non-negotiable)
- All routes prefixed `/api/v1/`
- Resources are nouns, not verbs (`/users`, not `/getUsers`)
- Use correct HTTP verbs (GET/POST/PUT/PATCH/DELETE)
- Every error response: `{ "error": "...", "code": "...", "details": {} }`
- Pagination on all list endpoints from day 1 (`limit`, `offset`)
- Never return 200 with an error body

---

## Database rules
- Every table has: `id` (uuid), `created_at`, `updated_at`
- Migrations via Alembic only — `alembic revision --autogenerate` then `alembic upgrade head`
- Never edit a migration that's been applied — create a new one
- Index every foreign key and every column used in WHERE clauses
- No raw SQL — use SQLAlchemy ORM

---

## Grindloop-specific rules

**Phase discipline:**
- Phase 1 only: Active schedule, Mastered archive, Todo, Auth, LeetCode lookup
- Do not add Phase 2 (Company Prep) or Phase 3 (Stripe) code until Phase 1 checklist in `STEPS.md` is fully green
- `company_questions` table exists in the schema but nothing should reference it until Phase 2

**Auth:**
- Passwords hashed via `app.core.security.hash_password()` — never plaintext, never manual
- All protected routes use `Depends(get_current_user)` — never check auth manually in a route
- Access token in React context (memory only) — never localStorage, never sessionStorage
- Refresh token in httpOnly cookie — set by backend, never readable by JS

**Security:**
- LeetCode Premium cookies (`LEETCODE_SESSION`, `CSRF_TOKEN`) in `backend/.env` only — never frontend, never committed
- CORS `allow_origins` must be an explicit list — never `["*"]` in production
- All public routes get `@limiter.limit("30/minute")` from slowapi

**What NOT to do:**
- No Supabase — deliberately excluded
- No Netlify — frontend on Cloudflare Pages, no serverless functions outside the backend
- No raw SQL — SQLAlchemy ORM only
- No manual ALTER TABLE — Alembic only
- No `requirements.txt` — use `uv add <package>` / `uv sync`
- No CSS frameworks or JS component libraries without discussion
- No business logic in route handlers — use services

---

## What I do NOT want
- Comments explaining obvious code
- Docstrings on every function unless it's a public API
- Abstractions for hypothetical future requirements
- Backwards-compatibility shims for code that hasn't shipped
- Error handling for impossible states
- Feature flags unless explicitly asked

---

## Session tracking
- `devlog/` — one file per completed chunk
- `LEARN.md` — concepts accumulated across sessions
- `/start-session` reads the above before orienting


Resume this session with:──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
claude --resume "frontend-foundation-landing-page"