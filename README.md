# get a j\*b

## requirements

- docker

## how to run

initially:

```
git clone https://github.com/ShoAnn/get-a-j-b.git
docker-compose up --build
```

afterwards you can just `docker-compose up`

## production

Prerequisites: `cp env.example .env`, then set real secrets in `.env`:

- `DB_PASSWORD` — strong database password
- `JWT_SECRET_KEY` — min 32 chars of randomness (`openssl rand -base64 48`).
  The API refuses to boot with the placeholder value.
- `CORS_ALLOWED_ORIGINS` — your public origin, e.g. `https://app.example.com`
- `API_URL` stays `http://api:8080` (internal docker DNS)

Build and run the production stack (compiled Go binary + Next.js
standalone, no bind mounts, no adminer, healthchecks):

```
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up --build -d
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml ps
```

Health: `GET /api/health` on both web (`:3000`) and api (`:8080`)
returns `{"status":"ok"}`. Commit `package-lock.json` so prod
`npm ci` installs are reproducible.

## done:
- [x] Set up project scaffolding with Next.js + React + Tailwind (App Router)
- [x] Create reusable button component with variants (primary, secondary, ghost)
- [x] Build add application modal/form with validation
- [x] Create status badge component 'draft', 'submitted', 'under_review', 'interview_scheduled', 'offer_extended', 'accepted', 'rejected', 'withdrawn', 'archived'
- [x] Implement list view with fields: title, company, status
- [x] Build application card component showing role, company, status, and date
- [x] Implement search bar to filter applications
- [x] Add filter dropdown by application status
- [x] Add sort options by date applied, company name, and status
- [x] for each job in the list add 'details' button to a job detail page with two column layout, 60% details for the job on the left and notes section on the right
- [x] Build dashboard page that shows stats (total saved, total applied, status chart, days since first application)
- [x] Add empty state illustrations when no jobs exist
- [x] Add board page with kanban board view grouped by statuses with drag-and-drop functionality to move jobs between statuses (now merged into `/jobs` page, staged drag + Save bar via `PATCH /api/jobs/{id}` → upstream `PUT`)
- [x] Add dark mode support using CSS variables / Tailwind class strategy
- [x] Create API client module (fetch wrapper with base URL, auth headers, error handling)
- [x] Wire auth flows: login page, register page, JWT storage (httponly cookie), protected routes
- [x] Connect Jobs List page to `GET /jobs` (loading, empty, error states)
- [x] Connect Job Detail page to `GET /jobs/{id}` (loading, 404, error states; edit/delete wired)
- [x] Connect AddJobModal to `POST /jobs` with mutation feedback
- [x] Connect Kanban Board to backend (drag → stage → Save → `PATCH /jobs/{id}`)
- [x] Connect Dashboard stats to backend (aggregate from `GET /jobs`)
- [x] Wire `Logout` handler into the router (`POST /api/auth/logout`)
- [x] Add handler-level tests for HTTP endpoints (`httptest` + mux coverage for auth/jobs/resumes/users)
- [x] Add CORS middleware (`CORS_ALLOWED_ORIGINS`, defaults to `http://localhost:3000`)
- [x] Add test scripts to `apps/web` (`vitest run`, `playwright test` for jobs CRUD e2e)
- [x] Build resume markdown CRUD UI (list/create/detail/edit with live preview; backend CRUD exists)

## todo:

### Frontend — Remaining
- [ ] Build Settings page (update profile, manage uploaded files) — no route yet, sidebar/header links are dummy
- [ ] Finish notification system (toast infra done; header bell is static, no panel/API/persistence)

### Backend — Remaining
- [x] Add `GET /api/users/me` (or `/api/profile`) shortcut (`UpdateUser` by `/{id}` exists with self-ownership check; see `TODO` in `apps/api/cmd/api/main.go`)
- [ ] Add server-side pagination to `GET /jobs` (currently returns all user jobs at once)

### Polish
- [ ] Extend loading skeletons and error boundaries to all pages (only dashboard/resumes have `animate-pulse`; no `error.tsx`/`loading.tsx`/`not-found.tsx` yet)
- [ ] Remove or replace placeholder test script in root `package.json` (`apps/web` already has `vitest`/`playwright`)
- [ ] Clean up `AddJobModal` wiring (uses raw `fetch`, hardcodes `location`/`salary`; move to `apiClient` and expose optional fields)

## pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password form, authenticates via `/auth/login` |
| `/register` | Register | Username + email + password form, creates account via `/auth/register` |
| `/` | Dashboard | Stats: total saved, total applied, status breakdown chart, days since first application |
| `/jobs` | Jobs List | List view with search bar, status filter, sort options, and job cards |
| `/jobs/[id]` | Job Detail | Full details of one job (role, company, status history, notes section) |
| `/board` | Kanban Board | Drag-and-drop columns per status to move jobs between stages |
| `/settings` | Settings | Update profile, manage uploaded files|

---

See [UI Design Spec](./design.md).
