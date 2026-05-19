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

- [x] Set up project scaffolding with Vite + React + Tailwind
- [] Create reusable button component with variants (primary, secondary, ghost)
- [] Build add application modal/form with validation
- [] Create status badge component 'draft', 'submitted', 'under_review', 'interview_scheduled', 'offer_extended', 'accepted', 'rejected', 'withdrawn', 'archived'
- [] Implement list view with fields: title, company, status
- [] Build application card component showing role, company, status, and date
- [] Implement search bar to filter applications
- [] Add filter dropdown by application status
- [] Add sort options by date applied, company name, and status
- [] Add application detail view and add notes section for each application
- [] Build dashboard stats section (total saved, total applied, status chart, days since first application)
- [] Add empty state illustrations when no applications exist
- [] Implement Kanban board view with drag-and-drop functionality to move applications between statuses
- [] Add dark mode support using CSS variables / Tailwind class strategy

summary
- **Setup** — project scaffolding and base components
- **Core UI** — the main application card, Kanban board, and form
- **Filtering** — search, filter, and sort features
- **Details** — the detail sidebar and notes
- **Dashboard** — stats and empty states
- **Polish** — responsive design and dark mode
