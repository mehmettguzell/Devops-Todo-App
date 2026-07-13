# Phase 1 Data Model: Task Fading & Archival

## Task (existing entity, extended)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | integer (autoincrement) | generated | Primary key. Unchanged. |
| `title` | text | yes | Unchanged. |
| `estimated_duration_minutes` | integer | yes | Unchanged. |
| `energy_level` | text enum: `low` \| `medium` \| `high` | yes | Unchanged. |
| `status` | text enum: `active` \| `faded` \| `archived` \| `completed` | yes | **Widened** from the 2-value enum in specs 001-002. Defaults to `active` on creation. See State Transitions below. |
| `created_at` | timestamp | generated | Unchanged. |
| `completed_at` | timestamp, nullable | generated | Unchanged. Null unless `status = completed`. |
| `last_touched_at` | timestamp | generated | **New**. Set on creation (= `created_at`), and updated on completion, revival, or fading-exemption removal (spec FR-001, FR-013). Drives fade/archive evaluation. |
| `fading_exempt` | boolean | generated (default `false`) | **New**. When `true`, the task never fades or archives (FR-010). |
| `due_date` | date, nullable | no | **New**. When present and not yet passed, the task is protected from fading/archival the same as `fading_exempt` (FR-014). Once passed, the fade/archive clock is considered to start from `due_date` rather than `last_touched_at` if that is later (FR-015). |

### Validation rules (new/changed)

- `due_date`, when provided, must be a valid calendar date; no other format constraint (spec does not
  require it to be in the future at creation time — a past due date simply offers no protection).
- `fading_exempt` and `due_date` are independent; both may be set on the same task, and either alone
  is sufficient to prevent fading (spec Edge Cases, User Story 5 Acceptance Scenario 3).
- All 001/002 validation rules (`title` non-empty, `estimated_duration_minutes > 0`, valid
  `energy_level`) are unchanged.

### State transitions

```
active --(fade threshold elapsed, not protected)--> faded
faded  --(archive threshold elapsed, not protected)--> archived
active --(mark complete)--> completed
faded  --(mark complete)--> completed
active --(revive)--> active (no-op other than clock reset)
faded  --(revive)--> active
archived --(revive)--> active
any (active/faded/archived) --(mark fading_exempt = true, or set a future due_date)--> active
  [if currently faded/archived, per Edge Cases: exemption/future-due-date is a contradiction with
  "neglected", so the task immediately returns to active]
```

- `faded → active` and `archived → active` (via revive, or via applying an exemption/future due
  date to an already-faded/archived task) both reset `last_touched_at = now()`.
- Removing `fading_exempt` (setting it back to `false`) resets `last_touched_at = now()` regardless
  of current status (FR-013) — the neglect clock restarts from the moment protection ends, it does
  not resume counting from before the exemption was set.
- `archived` tasks cannot be completed directly; they must be revived first (spec Edge Cases).
- The forward transitions (`active → faded → archived`) are evaluated lazily on every `/tasks`
  request (see research.md R1) — they are not a distinct user action.

### Effective fade/archive clock

For a non-exempt task, the "effective start" of its untouched-time clock is:

```
effective_start = due_date if (due_date is set AND due_date <= today AND due_date > last_touched_at)
                   else last_touched_at
```

A task is evaluated against the current `FadingSettings` thresholds:

- `now - effective_start >= archive_threshold_days` → `status = archived`
- `now - effective_start >= fade_threshold_days` → `status = faded`
- otherwise → `status` unchanged (remains `active`)

A task is skipped entirely by this evaluation (stays wherever it currently is) if `fading_exempt` is
`true`, or if `due_date` is set and still in the future.

### Derived query behavior

- Active list = `SELECT * FROM tasks WHERE status IN ('active', 'faded') ORDER BY (status = 'faded'), created_at DESC`
  — non-faded tasks first, faded tasks after, each group newest-first (FR-004).
- Archived view = `SELECT * FROM tasks WHERE status = 'archived' ORDER BY last_touched_at DESC`.
- Completed view = unchanged from specs 001-002 (`status = 'completed' ORDER BY completed_at DESC`).

## FadingSettings (new entity)

A single global configuration row governing fade/archive timing for all non-exempt,
non-due-dated tasks (spec Key Entities, User Story 6).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | integer | generated | Always `1` — single-row table, no multi-tenancy. |
| `fade_threshold_days` | integer | yes | Whole days of no touch before a task fades. Default `7`. |
| `archive_threshold_days` | integer | yes | Whole days of no touch before a faded task archives. Default `21`. Must be `> fade_threshold_days` (FR-017). |

### Validation rules

- `fade_threshold_days` and `archive_threshold_days` must both be positive integers.
- `archive_threshold_days` must be strictly greater than `fade_threshold_days`; a request that
  violates this is rejected with a 422 identifying the offending relationship (FR-017).
