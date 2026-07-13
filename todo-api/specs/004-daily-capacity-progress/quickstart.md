# Quickstart: Daily Capacity & Finishing Progress

Validates that the feature works end-to-end, per the user stories in [spec.md](./spec.md). This
feature is frontend-only (research.md R1) — no backend changes to verify directly, but the history
scenario needs a few completed tasks spread across recent days, which requires backdating
`completed_at` via `sqlite3` (same approach used in spec 003's quickstart).

## Prerequisites

- Backend and frontend already set up per `specs/001-bitir-task-skeleton/quickstart.md`.
- `sqlite3` CLI to backdate `completed_at` on a few tasks for the multi-day history scenario.

## Run

```bash
# Terminal 1 — backend
cd backend
uv run fastapi dev main.py

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open the frontend dev server URL (typically `http://localhost:5173`).

## Validation scenarios

1. **Set a realistic budget for today** (User Story 1)
   - On first load with no budget set, confirm a simple prompt to enter today's available time is
     shown.
   - Enter "3 hours" (or equivalent minutes) and confirm it.
   - Reload the page — confirm the budget is still in effect (not asked again).

2. **See remaining capacity at a glance** (User Story 2)
   - With a 3-hour budget set and nothing completed today, confirm remaining capacity reads as the
     full 3 hours.
   - Complete a task with a known duration (e.g., 30 minutes).
   - Confirm the displayed remaining capacity decreases by exactly 30 minutes.
   - Complete enough tasks to exceed the budget; confirm remaining capacity shows 0, not negative.

3. **Calm nudge, never a block, when over-planning** (User Story 3)
   - With a small budget (e.g., 1 hour) set, add active tasks totaling more than double that.
   - Confirm a calm advisory message appears suggesting some work could wait.
   - Confirm every normal action (add task, complete task, get a recommendation) still works
     unobstructed while the message is showing.
   - Complete or otherwise reduce planned tasks below the budget; confirm the message disappears.

4. **Recommendation respects remaining capacity** (FR-009)
   - With a small remaining capacity (e.g., 20 minutes left in the budget), request a recommendation
     for a larger available-time value (e.g., 60 minutes) with a task in the list that fits 60
     minutes but not 20.
   - Confirm that task is not recommended; only tasks fitting within the smaller remaining capacity
     are offered.

5. **Leave the day feeling what got finished** (User Story 4)
   - With zero completions today, confirm the progress summary shows a calm, encouraging starting
     state — no warnings, no pending-work counts.
   - Complete a couple of tasks; confirm the summary updates to show the count and total time
     completed today, with no mention of remaining/active/faded/archived tasks anywhere in it.

6. **See finishing momentum build over time** (User Story 5)
   - Backdate a couple of tasks' `completed_at` to previous days to populate history:
     `sqlite3 backend/bitir.db "UPDATE tasks SET completed_at = datetime('now', '-2 days') WHERE id = <task_id>;"`
   - Open the progress history view; confirm the last 7 days are shown, including zero-completion
     days rendered neutrally, and a current streak count consistent with the consecutive-day pattern
     seeded above.
   - Backdate a task to break the pattern (skip a day), confirm the streak count reflects the reset
     without any negative or blaming language.

## Reference

- Data model (frontend-derived, no backend changes): [data-model.md](./data-model.md)
- Design decisions: [research.md](./research.md)
