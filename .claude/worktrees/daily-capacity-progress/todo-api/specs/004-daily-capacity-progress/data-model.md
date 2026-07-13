# Phase 1 Data Model: Daily Capacity & Finishing Progress

This feature introduces no backend schema changes (research.md R1). Every entity below is a
frontend-only, derived or client-stored concept — there are no new database tables, columns, or API
response shapes.

## Daily Capacity (client-stored + derived)

| Field | Type | Source | Notes |
|---|---|---|---|
| `dateKey` | string (`YYYY-MM-DD`, local) | derived from the browser's current local date | Storage key; a new key exists implicitly each day (no explicit reset needed — see FR-015). |
| `budgetMinutes` | integer \| absent | user input, stored in `localStorage` under a key scoped to `dateKey` | Absent until the user enters a budget for the day (FR-001, FR-002). Never pre-filled from a prior day (Clarifications). |
| `plannedMinutes` | integer | derived: sum of `estimated_duration_minutes` over all tasks in `activeTasks` (active + faded) | Recomputed live as tasks are added/completed/faded (FR-003, FR-004). |
| `completedTodayMinutes` | integer | derived: sum of `estimated_duration_minutes` over tasks in `completedTasks` whose `completed_at` falls on `dateKey` | Used for remaining capacity (FR-007). |
| `remainingMinutes` | integer | derived: `max(0, budgetMinutes - completedTodayMinutes)` | Floors at zero (FR-008); only meaningful once `budgetMinutes` is set. |
| `isOverPlanned` | boolean | derived: `plannedMinutes > budgetMinutes` | Drives the over-budget nudge (FR-005); only meaningful once `budgetMinutes` is set. |

### Validation rules

- `budgetMinutes` must be a positive whole number of minutes when set (the input accepts an
  hours/minutes-friendly entry, e.g. "3 hours", converted to minutes for storage).
- No validation ties `plannedMinutes` to `budgetMinutes` — exceeding it is allowed and only produces
  an advisory (FR-005), never a rejection.

### Lifecycle

```
(no budget for today) --(user enters a budget)--> (budget set for today)
(budget set for today) --(new local day begins)--> (no budget for today) [new dateKey, nothing to migrate]
```

- There is no explicit "reset" action or backend job — the day boundary happens for free because the
  `localStorage` key is scoped to `dateKey`, and `completedTodayMinutes`/`plannedMinutes` are always
  recomputed from current data (FR-015).

## Progress Summary (derived, same-day)

| Field | Type | Source | Notes |
|---|---|---|---|
| `completedCountToday` | integer | derived: count of tasks in `completedTasks` whose `completed_at` falls on today's `dateKey` | Displayed regardless of whether a budget is set (FR-010). |
| `completedMinutesToday` | integer | derived: same as `completedTodayMinutes` above | Same value reused for both remaining-capacity and progress-summary display. |

### Validation rules

- Contains no reference to `activeTasks`, `faded`, or `archived` tasks under any circumstance
  (FR-011) — only ever reads from `completedTasks`.

## Progress History (derived, last 7 days)

| Field | Type | Source | Notes |
|---|---|---|---|
| `days` | array of `{ dateKey, completedCount, completedMinutes }`, length 7 | derived: bucket `completedTasks` by local `completed_at` date for the 7 most recent local calendar days (today inclusive) | Days with zero completions appear with `completedCount = 0`, rendered neutrally, never omitted (FR-013, Edge Cases). |
| `currentStreak` | integer | derived: consecutive days counting backward from today (or from yesterday if today has no completions yet) with `completedCount >= 1`, stopping at the first zero-completion day | Resets to 0 the day after a gap (FR-014, Edge Cases). |

### Validation rules

- Built solely from `completedTasks` — never references unfinished work (FR-011, User Story 5
  Acceptance Scenario 3).

## Task (existing entity, unchanged)

No new fields. `estimated_duration_minutes` and `completed_at` (already present since spec
001/003) are the only fields this feature reads.
