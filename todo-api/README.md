# Bitir

A task manager focused on finishing work, not hoarding it. Capture a task, see only what's active,
mark it done, and review what you've finished. The active view also includes a single-task
recommendation area: enter your available time and current energy to get one matching task at a
time, with options to complete it, ask for another, or dismiss it.

Tasks that go untouched quietly fade (muted styling, lower priority in the list and in
recommendations) and, left untouched longer, move to a separate Archive view. Fade and archive any
task in one click, pin a task exempt from fading, or give it a due date to protect it automatically
until that date passes. The fade/archive pace (defaults: 7 days to fade, 21 to archive) is
adjustable from the Settings button in the header.

On the Active view, enter today's time budget once (e.g. "1 hour 30 minutes") and Bitir tracks
remaining capacity as you complete tasks, nudging you calmly (never blocking) if today's planned
work adds up to more than you budgeted. A progress panel always shows what you've finished today
plus the last 7 days of completions and your current finishing streak — it never mentions
unfinished work. The budget resets automatically each new day and lives only in your browser
(`localStorage`), so it needs no backend changes.

## Prerequisites

- Python 3.13+ with [uv](https://docs.astral.sh/uv/)
- Node.js (LTS) with npm

## Backend setup

```bash
cd backend
uv sync
cp .env.example .env
```

Run it:

```bash
cd backend
uv run fastapi dev main.py
```

The API is served at `http://localhost:8000`.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Run it:

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## Using the API

- `GET /tasks?status=active|completed|archived` — list tasks (defaults to `active`; `active` includes
  faded tasks, ordered after fresh ones)
- `POST /tasks` — create a task (`title`, `estimated_duration_minutes`, `energy_level`:
  `low`/`medium`/`high`, optional `due_date`)
- `PATCH /tasks/{task_id}/complete` — mark a task completed (idempotent; 409 if archived)
- `PATCH /tasks/{task_id}/revive` — bring a faded or archived task back to fresh/active
- `PATCH /tasks/{task_id}/fading` — set a task's `fading_exempt` flag and/or `due_date`
- `GET /settings/fading` / `PUT /settings/fading` — read/update the fade and archive thresholds (days)

Full contracts: [`specs/003-task-fading/contracts/tasks-api.yaml`](specs/003-task-fading/contracts/tasks-api.yaml),
[`specs/003-task-fading/contracts/settings-api.yaml`](specs/003-task-fading/contracts/settings-api.yaml).

Interactive docs are available at `http://localhost:8000/docs` while the backend is running.
