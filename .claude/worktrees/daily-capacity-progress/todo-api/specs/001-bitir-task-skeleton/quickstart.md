# Quickstart: Bitir — Active Task List Skeleton

Validates that the feature works end-to-end, per the user stories in [spec.md](./spec.md).

## Prerequisites

- Python 3.13, with `uv` (already used by this repo) or `pip`.
- Node.js (LTS) + npm, for the Vite/React frontend.

## Setup

```bash
# Backend
cd backend
uv sync              # or: pip install -e .
cp .env.example .env # set DATABASE_PATH if not using the default

# Frontend
cd ../frontend
npm install
cp .env.example .env # set VITE_API_BASE_URL to the backend's URL
```

## Run

```bash
# Terminal 1 — backend
cd backend
uv run fastapi dev main.py   # or: uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open the frontend dev server URL printed by Vite (typically `http://localhost:5173`).

## Validation scenarios

Each scenario maps to an acceptance scenario in spec.md.

1. **Capture a task** (User Story 1)
   - Click "Add task". Fill in title "Write report", duration `30`, energy `medium`. Submit.
   - Expect: modal closes; "Write report" appears at the top of the active list showing 30 min /
     medium.

2. **See only what's actionable** (User Story 2)
   - With one or more active tasks present, reload the page.
   - Expect: the same tasks are still listed (proves server-side persistence, FR-014), newest task
     at the top.
   - With zero active tasks, expect a calm empty-state message instead of a blank page.

3. **Finish a task and feel momentum** (User Story 3)
   - Click the "mark complete" control on an active task.
   - Expect: the task disappears from the active list immediately.
   - Click the same control again in quick succession (or resend the same request).
   - Expect: no error, no duplicate — idempotent per contracts/tasks-api.yaml.

4. **Review what's been finished** (User Story 4)
   - Navigate to the "Completed" view.
   - Expect: the task from step 3 appears, showing title/duration/energy, most-recently-completed
     first.
   - With zero completed tasks, expect a calm empty-state message.

5. **Validation edge case**
   - Open "Add task", leave the title empty (or omit duration/energy), submit.
   - Expect: submission is rejected, modal stays open, the missing field is indicated (FR-005,
     contracts/tasks-api.yaml `422` response).

## Reference

- API contract: [contracts/tasks-api.yaml](./contracts/tasks-api.yaml)
- Data model: [data-model.md](./data-model.md)
