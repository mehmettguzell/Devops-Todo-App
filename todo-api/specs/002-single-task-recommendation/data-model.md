# Phase 1 Data Model: Single-Task Recommendation Engine

This feature introduces no changes to persisted data. The `Task` entity and its backing SQLite table
(see `specs/001-bitir-task-skeleton/data-model.md`) are unchanged — recommendation suitability is
derived entirely from the existing `estimated_duration_minutes` and `energy_level` fields.

The entities below are transient, frontend-only concepts (spec Key Entities) that exist only in React
component state and are never sent to or stored by the backend.

## Recommendation Request (transient, client-side only)

The user's stated situation at a point in time.

| Field | Type | Required | Notes |
|---|---|---|---|
| `minutes` | integer | yes | Whole number, > 0 (spec FR-002/Edge Cases: 0/negative/non-integer rejected client-side before computing a recommendation). |
| `energy` | enum: `low` \| `medium` \| `high` | yes | Same fixed 3-point scale as `Task.energy_level`. |

Not persisted anywhere; held in `RecommendationPanel` component state and cleared on page reload
(spec Clarifications: reload resets to the empty input state).

## Recommendation Cycle (transient, client-side only)

Tracks which tasks have already been shown and declined ("not now") since the last Recommendation
Request was submitted.

| Field | Type | Notes |
|---|---|---|
| `request` | Recommendation Request | The criteria this cycle is evaluated against. |
| `declinedTaskIds` | set of integer | Task IDs the user has said "not now" to during this cycle. Reset to empty whenever a new Recommendation Request is submitted or the recommendation is dismissed (spec FR-012). |
| `currentTaskId` | integer, nullable | The task currently shown as "the recommendation", or `null` when no suitable task exists (spec User Story 3) or all suitable tasks have been declined (spec FR-009). |

### Derived computation (pure function, see research.md)

1. **Suitable set** = active tasks where `estimated_duration_minutes <= request.minutes` AND
   `energyIndex(task.energy_level) <= energyIndex(request.energy)` (spec FR-003).
2. **Candidate set** = Suitable set minus `declinedTaskIds` (spec FR-008).
3. **Selection** = from Candidate set, the task with the smallest `estimated_duration_minutes`;
   ties broken by earliest `created_at` (spec FR-005, Clarifications).
4. If Suitable set is empty → "nothing suitable" state (spec FR-011).
5. If Suitable set is non-empty but Candidate set is empty → "alternatives exhausted" state (spec FR-009).
6. If the task at `currentTaskId` is no longer active (e.g., completed elsewhere) at render time,
   the cycle is re-evaluated against the current active task list rather than acted upon (spec FR-013).

### State transitions

```
(no request) --submit time+energy--> evaluating --> showing a task | nothing-suitable | alternatives-exhausted
showing a task --"not now"--> evaluating (task added to declinedTaskIds)
showing a task --"complete"--> task completed via existing PATCH /tasks/{id}/complete, cycle cleared
showing a task --"dismiss"--> (no request) — declinedTaskIds cleared, input area shown again
any state --submit new time+energy--> evaluating (declinedTaskIds reset, new request)
any state --page reload--> (no request), input area empty (spec Clarifications)
```
