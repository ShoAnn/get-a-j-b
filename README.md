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

## todo:

v0.1 Setup
Set up project scaffolding with Vite + React + Tailwind

#1 feature, good first issue
Create reusable button component with variants (primary, secondary, ghost)

#2 feature, good first issue

v0.2 Core UI
Build application card component showing role, company, status, and date

#3 feature, high priority
Implement Kanban board layout with drag-and-drop between status columns

#4 feature, high priority
Build add application modal/form with validation

#5 feature, high priority
Create status badge component (Applied, Interview, Offer, Rejected)

#6 feature, good first issue
Application status badge shows wrong color after drag-and-drop update

v0.3 Filtering
Implement search bar to filter applications by role or company name

#7 feature
Add filter dropdown by application status

#8 feature
Add sort options by date applied, company name, and status

#9 enhancement

v0.4 Details
Build application detail sidebar / drawer with full notes and timeline

#10 feature
Add notes/comments section inside application detail view

#11 enhancement

v0.5 Dashboard
Build dashboard stats section (total applied, interviews, offer rate)

#12 feature
Add empty state illustrations when no applications exist

#13 enhancement
good first issue

v0.6 Polish
Make layout fully responsive for mobile and tablet views

#14 enhancement, high priority
Add dark mode support using CSS variables / Tailwind class strategy

#15 enhancement

summary
- **v0.1 Setup** — project scaffolding and base components
- **v0.2 Core UI** — the main application card, Kanban board, and form
- **v0.3 Filtering** — search, filter, and sort features
- **v0.4 Details** — the detail sidebar and notes
- **v0.5 Dashboard** — stats and empty states
- **v0.6 Polish** — responsive design and dark mode
