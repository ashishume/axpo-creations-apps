# Start Tech Backend

FastAPI backend for **Billing** and **Teaching** applications. Single codebase, two base URLs, two independent databases and auth systems.

## Architecture

- **Billing API**: `/billing/api/v1/*` — uses `BILLING_DATABASE_URL`, own users and JWT (domain `billing`).
- **Teaching API**: `/teaching/api/v1/*` — uses `TEACHING_DATABASE_URL`, own users and JWT (domain `teaching`).

Auth is JWT + HTTP-only cookies; each domain has separate login and tokens.

## Setup

### 1. Environment

Copy `.env.example` to `.env` and set:

- `BILLING_DATABASE_URL` — Postgres URL for billing (e.g. Supabase or local).
- `TEACHING_DATABASE_URL` — Postgres URL for teaching (e.g. Supabase or local).
- `JWT_SECRET_KEY` — Secret for signing JWTs (use a strong value in production).
- For local dev: `COOKIE_SECURE=false`, `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`.

**Supabase (same project for both apps):**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **Database**.
2. Under **Connection string** choose **URI** and the **Transaction** (or Session) pooler.
3. Copy the URI (e.g. `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres`).
4. Replace the prefix: change `postgresql://` to **`postgresql+asyncpg://`** (required for this backend).
5. Put that same URL in both `BILLING_DATABASE_URL` and `TEACHING_DATABASE_URL` if you use one Supabase project.

Until these are real URLs, **login will return 500** with `nodename nor servname provided, or not known` (invalid host).

**Containers (Docker, Cloud Run, ECS, etc.):** The app must be able to reach the DB host from inside the container. Do **not** use `localhost` or `127.0.0.1` for the DB host—use the real hostname or IP of your Postgres (e.g. Supabase pooler host, Cloud SQL connection name, or an IP reachable on the container network). Otherwise you will see **503** with `Network is unreachable` or **500** with connection errors on login.

Use async Postgres URLs, e.g.:

```bash
BILLING_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/billing_db
TEACHING_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/teaching_db
```

### 2. Install and run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

### 3. Migrations (Alembic)

Two separate databases; run migrations per DB using `TARGET_DB`:

```bash
# Billing DB
TARGET_DB=billing alembic revision --autogenerate -m "billing schema"
TARGET_DB=billing alembic upgrade head

# Teaching DB
TARGET_DB=teaching alembic revision --autogenerate -m "teaching schema"
TARGET_DB=teaching alembic upgrade head
```

Use the same Postgres URLs as in `.env` (Alembic uses a sync driver internally).

## API Overview

### Billing (`/billing/api/v1`)

| Area   | Prefix        | Notes                    |
|--------|---------------|--------------------------|
| Auth   | `/auth`       | POST login, logout, refresh; GET me |
| Companies | `/companies` | CRUD                     |
| Products  | `/products` | CRUD                     |
| Customers | `/customers` | CRUD                     |
| Invoices  | `/invoices` | CRUD + items             |
| Payments  | `/payments` | CRUD + allocations       |
| Expenses  | `/expenses` | CRUD                     |
| Stocks    | `/stocks`   | Stock movements CRUD     |

- **Login**: POST `/billing/api/v1/auth/login` with `{"email": "...", "password": "..."}`. Sets HTTP-only cookies; use `credentials: 'include'` from the frontend.

### Teaching (`/teaching/api/v1`)

| Area   | Prefix      | Notes                    |
|--------|-------------|--------------------------|
| Auth   | `/auth`     | POST login, logout, refresh; GET me |
| Schools   | `/schools`   | CRUD                     |
| Sessions  | `/sessions`  | CRUD                     |
| Classes   | `/classes`   | CRUD                     |
| Students  | `/students`  | CRUD                     |
| Staff      | `/staff`     | CRUD                     |
| Expenses  | `/expenses`  | CRUD                     |
| Stocks     | `/stocks`    | CRUD                     |

- **Login**: POST `/teaching/api/v1/auth/login` with `{"username": "...", "password": "..."}`. Sets HTTP-only cookies; use `credentials: 'include'` from the frontend.

Protected routes require the cookie set by the same domain’s login; no token in the request body.

## Docker

### Local dev (backend + two Postgres DBs)

```bash
docker compose up --build
```

- Backend: http://localhost:8000  
- Billing Postgres: localhost:5433 (user `billing_user`, db `billing_db`)  
- Teaching Postgres: localhost:5434 (user `teaching_user`, db `teaching_db`)  

Then run migrations as above, using:

- Billing: `postgresql+asyncpg://billing_user:billing_pass@localhost:5433/billing_db`
- Teaching: `postgresql+asyncpg://teaching_user:teaching_pass@localhost:5434/teaching_db`

### Production

Build and run the backend image with env vars set (e.g. via your orchestrator or `.env`):

- `BILLING_DATABASE_URL`, `TEACHING_DATABASE_URL` (async Postgres URLs)
- `JWT_SECRET_KEY`
- `COOKIE_SECURE=true`, `CORS_ORIGINS` as needed

No code changes are required when switching to a managed Postgres (Supabase, RDS, Cloud SQL, Neon, etc.); only the connection strings.

## Switching to another SQL provider

The app uses SQLAlchemy with the Postgres dialect. To move to another provider:

1. Point `BILLING_DATABASE_URL` and/or `TEACHING_DATABASE_URL` to the new instance (same format: `postgresql+asyncpg://...` for Postgres).
2. Run Alembic migrations against the new DB(s) as above.
3. No application code changes are needed beyond connection strings.

## Tests

```bash
pip install -e ".[dev]"
pytest
```
