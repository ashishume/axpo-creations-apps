# Configuration & deployment options

This app is built so you can change the data source and run in maintenance mode with **config and minimal code changes**.

---

## 1. Maintenance mode

Use during upgrades or deployments so users see a friendly message instead of the app.

- **Enable:** Set in `.env` or `.env.production`:
  - `VITE_MAINTENANCE_MODE=true` (or `1`)
  - Optional: `VITE_MAINTENANCE_MESSAGE="Custom message here."`
- Rebuild and deploy. When the upgrade is done, remove the variable (or set to `false`) and redeploy.

---

## 2. Switching to another SQL database (e.g. Google Cloud SQL, AWS RDS)

All database access goes through **repository modules** under `src/lib/db/repositories/`. They currently use **Supabase** via `src/lib/db/supabase.ts` (`getSupabase()`).

- **Schema:** PostgreSQL schema and migrations live in `src/lib/db/schema.sql` and `src/lib/db/migrations/`. They are standard SQL and can be run on any Postgres (Cloud SQL, RDS, etc.).

To move to another SQL backend with **minimal app changes**:

1. **Option A – Backend API:** Run a small backend (Node/Go/etc.) that connects to your Postgres (Cloud SQL, RDS) and exposes REST (or GraphQL) endpoints that mirror what the repositories do. Point the app at this API using the **Backend API** config below. No Supabase; your backend is the only thing talking to the DB.

2. **Option B – Swap the client in the app:** Keep the repository **interfaces** (same method names and types). Implement a second “data client” (e.g. `src/lib/db/postgres-client.ts` or a REST client) that your repositories can use instead of `getSupabase()`. Use an env flag (e.g. `VITE_DB_CLIENT=supabase` vs `postgres`) to choose which client is used. The rest of the app stays the same; only the repo implementations and one client module change.

Repositories today call `getSupabase()` and then Supabase-specific APIs (`.from('table').select()`). For Option B you would either:

- Implement a small adapter that exposes the same operations (e.g. `getSchools()`, `createSchool()`) and is implemented with `pg` or another Postgres client, or  
- Implement repositories that use the shared **API client** (see below) when `VITE_USE_BACKEND_API=true`, and keep Supabase when false.

---

## 3. Using a REST backend instead of direct Supabase

To serve the app from your own backend (e.g. Node/Express, Go, .NET) that talks to Supabase, Postgres, or any DB:

1. **Env (for when you implement the client):**
   - `VITE_USE_BACKEND_API=true`
   - `VITE_API_BASE_URL=https://your-api.example.com` (no trailing slash)

2. **Code pattern:** The app currently calls `getSupabase()` from each repository. To support a REST backend:
   - Add a shared API client (e.g. `src/lib/api/client.ts`) that uses `fetch(VITE_API_BASE_URL + '/schools')` (or your route scheme) when `VITE_USE_BACKEND_API` is set.
   - In each repository, branch on config: if “use backend API”, call the API client; otherwise call `getSupabase()` as today. Types and repository method signatures stay the same, so the rest of the app (context, pages, hooks) needs no changes.

A placeholder `src/lib/api/client.ts` is provided: it reads `VITE_API_BASE_URL` and exports a `getApiBaseUrl()` helper. When you add your backend, implement the actual HTTP calls there (or in the repos) using this base URL.

---

## 4. Env summary

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (current default backend). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key. |
| `VITE_MAINTENANCE_MODE` | `true` or `1` = show maintenance page. |
| `VITE_MAINTENANCE_MESSAGE` | Optional custom message on maintenance page. |
| `VITE_API_BASE_URL` | For future use: base URL of your REST API. |
| `VITE_USE_BACKEND_API` | For future use: `true` to use REST API instead of Supabase. |

---

## 5. Backup & restore

- **Backup:** Sidebar → “Backup data” downloads a JSON file with all schools, sessions, classes, students (with payments), staff, expenses, stocks, fixed costs, and organizations (schema version 2).
- **Restore:** Sidebar → “Restore data” → choose the JSON file. Restore creates organizations (if present), then schools, sessions, classes, students (and their fee payments), staff, expenses, and stocks. Old backups without `schemaVersion` or `organizations` still work.
