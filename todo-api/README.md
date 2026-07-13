# Bitir

A task manager focused on finishing work, not hoarding it. This is the active-task-list skeleton:
capture a task, see only what's active, mark it done, and review what you've finished. The active
view also includes a single-task recommendation area: enter your available time and current energy
to get one matching task at a time, with options to complete it, ask for another, or dismiss it.

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

- `GET /tasks?status=active|completed` — list tasks (defaults to `active`)
- `POST /tasks` — create a task (`title`, `estimated_duration_minutes`, `energy_level`: `low`/`medium`/`high`)
- `PATCH /tasks/{task_id}/complete` — mark a task completed (idempotent)

Full contract: [`specs/001-bitir-task-skeleton/contracts/tasks-api.yaml`](specs/001-bitir-task-skeleton/contracts/tasks-api.yaml).

Interactive docs are available at `http://localhost:8000/docs` while the backend is running.
