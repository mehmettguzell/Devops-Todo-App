# Phase 1 Data Model: Bitir — Active Task List Skeleton

## Task

Represents a single unit of work the user wants to do (spec Key Entities: Task).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | integer (autoincrement) | generated | Primary key. |
| `title` | text | yes | Non-empty (spec Edge Cases: empty title rejected). |
| `estimated_duration_minutes` | integer | yes | Whole number of minutes, > 0 (spec Clarifications). |
| `energy_level` | text enum: `low` \| `medium` \| `high` | yes | Fixed 3-point scale (spec Assumptions). |
| `status` | text enum: `active` \| `completed` | yes | Defaults to `active` on creation. One-way transition `active → completed` only (spec Key Entities). |
| `created_at` | timestamp | generated | Set on insert. Drives active-list "newest-first" ordering (spec Clarifications). |
| `completed_at` | timestamp, nullable | generated | Set when `status` transitions to `completed`. Drives completed-view "most-recently-completed-first" ordering (spec Clarifications). Null while `status = active`. |

### Validation rules

- `title`: required, non-empty after trimming whitespace (Edge Cases).
- `estimated_duration_minutes`: required, integer, must be > 0.
- `energy_level`: required, must be exactly one of `low`, `medium`, `high`.
- Incomplete submissions (missing/invalid `title`, `estimated_duration_minutes`, or `energy_level`)
  are rejected with a 422 response identifying the offending field(s) (FR-005).

### State transitions

```
active --(mark complete)--> completed
```

- Only one transition exists; there is no `completed → active` transition in this skeleton
  (spec Assumptions: "no reopen/undo action").
- Marking an already-`completed` task complete again is a no-op: the request succeeds (200) and
  `completed_at` is left unchanged — it does not error and does not create a duplicate (Edge Cases).

### Derived query behavior

- Active list = `SELECT * FROM tasks WHERE status = 'active' ORDER BY created_at DESC`.
- Completed view = `SELECT * FROM tasks WHERE status = 'completed' ORDER BY completed_at DESC`.
