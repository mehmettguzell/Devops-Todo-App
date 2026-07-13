# Quickstart: Single-Task Recommendation Engine

Validates that the feature works end-to-end, per the user stories in [spec.md](./spec.md).

## Prerequisites

- Backend and frontend already set up and runnable per
  [specs/001-bitir-task-skeleton/quickstart.md](../001-bitir-task-skeleton/quickstart.md) — this
  feature adds no new setup steps (no new dependencies, no new environment variables).
- At least a few active tasks seeded with a spread of durations and energy levels, e.g.:
  - "Quick email" — 10 min, low
  - "Write report" — 45 min, medium
  - "Deep refactor" — 90 min, high

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

Each scenario maps to an acceptance scenario in spec.md.

1. **Get told what to do right now** (User Story 1)
   - In the recommendation area, enter `45` minutes and select `medium` energy.
   - Expect: exactly one task is shown ("Write report" — 45 min ≤ 45, medium ≤ medium), and no other
     candidate tasks are listed alongside it (FR-003, FR-004).
   - Seed a second task that also fits (e.g., "Quick email" — 10 min, low) and repeat.
   - Expect: the shorter task ("Quick email", 10 min) is recommended first (FR-005 — shortest
     duration wins).

2. **Act on the recommendation** (User Story 2)
   - With a recommendation showing, click "Complete".
   - Expect: the task moves to the Completed view exactly as from the active list (FR-007).
   - Request a new recommendation, then click "Not now".
   - Expect: a different suitable task appears (FR-008), or an "alternatives exhausted" message if
     none remain (FR-009).
   - Request a new recommendation, then click "Dismiss".
   - Expect: the recommendation area closes, the active list is shown unaffected, and the declined
     task's status is unchanged (FR-010).

3. **Nothing fits right now** (User Story 3)
   - Enter `5` minutes and `low` energy (assuming no task fits that combination).
   - Expect: a calm message indicating nothing suitable is available right now, no task shown, and no
     prompt to add a new task (FR-011).

4. **Reload clears the cycle** (Clarifications)
   - With a recommendation showing, reload the page.
   - Expect: the input area is empty again — no time/energy pre-filled, no recommendation shown
     (FR-014).

5. **Invalid input**
   - Enter `0` or a negative number for minutes and submit.
   - Expect: the app prompts for a valid positive whole number instead of returning a recommendation
     or the no-match message (FR-002).

## Reference

- Data model (transient recommendation state): [data-model.md](./data-model.md)
- Research/decisions: [research.md](./research.md)
- `Task` REST contract (unchanged, reused as-is): [../001-bitir-task-skeleton/contracts/tasks-api.yaml](../001-bitir-task-skeleton/contracts/tasks-api.yaml)
