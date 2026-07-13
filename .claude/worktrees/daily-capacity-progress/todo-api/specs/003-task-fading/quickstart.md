# Quickstart: Task Fading & Archival

Validates that the feature works end-to-end, per the user stories in [spec.md](./spec.md).

## Prerequisites

- Backend and frontend already set up per `specs/001-bitir-task-skeleton/quickstart.md`.
- `sqlite3` CLI (or any SQLite browser) to backdate a task's `last_touched_at` for testing, since
  fading normally takes days to occur in real time and the app deliberately has no way to fast-forward
  time through the UI.

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

Each scenario maps to a user story in spec.md. Steps 1-3 require artificially backdating a task's
`last_touched_at` via direct SQLite access, since the feature intentionally has no "fast forward
time" control in the UI.

1. **See neglect without being nagged** (User Story 1)
   - Add a task via the UI (fresh task).
   - Add a second task, then backdate it past the fade threshold:
     `sqlite3 backend/bitir.db "UPDATE tasks SET last_touched_at = datetime('now', '-8 days') WHERE id = <second_task_id>;"`
     (default fade threshold is 7 days).
   - Reload the active list (or switch view and back).
   - Expect: the second task renders with a visibly muted/faded style, ordered after the fresh task;
     no popup, toast, or badge appears anywhere.

2. **Old, forgotten work quietly leaves the list** (User Story 2)
   - Backdate a task past the archive threshold:
     `sqlite3 backend/bitir.db "UPDATE tasks SET last_touched_at = datetime('now', '-22 days') WHERE id = <task_id>;"`
     (default archive threshold is 21 days).
   - Reload the active list.
   - Expect: the task no longer appears in the active list. Open the "Archive" view — the task
     appears there with title, duration, and energy level.

3. **Bring a task back to life** (User Story 3)
   - From the Archive view, click "Revive" on the task from step 2.
   - Expect: the task disappears from the Archive view and reappears in the active list, rendered
     fresh (not faded).
   - Repeat with a faded (not yet archived) task from step 1's "Revive" control directly in the
     active list; expect the same fresh, un-faded result.

4. **Protect tasks that are important but slow-moving** (User Story 4)
   - On a fresh active task, click "Pin" (or the exemption toggle) to mark it exempt from fading.
   - Backdate it past both thresholds (as in steps 1-2) and reload.
   - Expect: it still renders fresh, not faded, and does not move to the Archive view.
   - Remove the exemption; backdate again; expect it now fades/archives normally from that point.

5. **Give a task a due date so it stays put automatically** (User Story 5)
   - Create a task with a due date a week in the future.
   - Backdate its `last_touched_at` past both thresholds and reload.
   - Expect: it still renders fresh (the future due date protects it).
   - Update its due date to yesterday (via `PATCH /tasks/{id}/fading`) and reload.
   - Expect: it becomes eligible for fading again, timed from the due date.

6. **Tune the pace of fading** (User Story 6)
   - Open Settings; confirm the defaults show 7 (fade) and 21 (archive) days.
   - Change fade to 2 and archive to 5; save.
   - Expect: a task backdated 3 days now shows as faded on next reload, without needing code changes.
   - Attempt to set archive ≤ fade; expect a clear inline rejection, not a silent failure.

7. **Recommendation deprioritizes faded tasks**
   - Seed one fresh and one faded task that both match the same time/energy entry.
   - Request a recommendation.
   - Expect: the fresh task is recommended first; only after declining it ("not now") does the faded
     task appear.

## Reference

- API contracts: [contracts/tasks-api.yaml](./contracts/tasks-api.yaml),
  [contracts/settings-api.yaml](./contracts/settings-api.yaml)
- Data model: [data-model.md](./data-model.md)
