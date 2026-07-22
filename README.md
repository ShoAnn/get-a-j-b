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

## done:
- [x] Set up project scaffolding with Vite + React + Tailwind
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
- [x] Add board page with kanban board view grouped by statuses with drag-and-drop functionality to move jobs between statuses
- [x] Add dark mode support using CSS variables / Tailwind class strategy

## todo:

### Frontend — API Integration
- [x] Create API client module (fetch wrapper with base URL, auth headers, error handling)
- [x] Wire auth flows: login page, register page, JWT storage (httponly cookie), protected routes
- [ ] Connect Jobs List page to `GET /jobs` (loading, empty, error states)
- [ ] Connect Job Detail page to `GET /jobs/{id}`
- [ ] Connect AddJobModal to `POST /jobs` with mutation feedback
- [ ] Connect Kanban Board to backend (drag → `PUT /jobs/{id}` status update)
- [ ] Connect Dashboard stats to backend (aggregate from `GET /jobs`)

### Backend — Gaps
- [ ] Wire `Logout` handler into the router (`POST /auth/logout`)
- [ ] Add handler-level/integration tests for HTTP endpoints
- [ ] Add CORS middleware (needed since Next.js and API run on different ports)

### Features — Not Started
- [ ] Build Settings page (update profile, manage uploaded files)
- [ ] Build resume upload UI (backend handlers exist, no frontend)
- [ ] Implement notification system

### Polish
- [ ] Add loading skeletons and error boundaries to all pages
- [ ] Add pagination to `GET /jobs` (currently returns all user jobs at once)
- [ ] Either add tests to `package.json` or remove the placeholder test script

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

# UI design spec:

**COLOR PALETTE**
- Midnight `#1A1A2E` — Primary (backgrounds, nav)
- Violet `#7F77DD` — Accent (buttons, links, highlights)
- Teal `#1D9E75` — Success (badges, confirmations)
- Off-white `#F5F5F0` — Surface (cards, sections)
- Error Red `#E24B4A` — Destructive actions, alerts

---
**TYPOGRAPHY**
- Display / Hero: Sora · 48px · weight 600
- Heading 1: Sora · 32px · weight 500
- Heading 2: Sora · 24px · weight 500
- Heading 3: Sora · 18px · weight 500
- Body: Inter · 16px · weight 400 · line-height 1.7
- Small / Label: Inter · 12px · weight 400 · color text-secondary

---
**SPACING SCALE**
- xs — 4px
- sm — 8px
- md — 16px
- lg — 24px
- xl — 40px
- 2xl — 64px
Grid: 12 columns · Gutter: 24px · Margin: 80px (desktop), 16px (mobile)
---

**COMPONENTS**
Buttons:
- Primary: bg #7F77DD · text white · padding 10px 20px · radius 8px · font 14px/500
- Secondary: bg transparent · border 1.5px #7F77DD · text #7F77DD · same padding
Badges:
- Success: bg #EAF3DE · text #27500A · padding 6px 14px · radius 8px · font 12px/500
- Error: bg #FCEBEB · text #791F1F · same padding
Inputs:
- Default: border 0.5px #ccc · radius 8px · padding 9px 12px · font 13px
- Focus: border 1.5px #7F77DD

---
**REDLINE SPECS — FEATURE CARD**
- Card: padding 20px · radius 12px · bg #F5F5F0 · border 0.5px #ddd
- Icon container: 36×36px · radius 8px · bg #7F77DD
- Card title: 15px · weight 500 · margin-top 12px
- Body text: 12px · weight 400 · line-height 1.5 · margin-top 6px · color text-secondary
