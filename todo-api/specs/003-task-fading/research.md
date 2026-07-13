# Phase 0 Research: Task Fading & Archival

## R1: Fade/archive evaluation mechanism

**Decision**: Lazy, on-read evaluation. A single `apply_fading_transitions()` sweep runs as a FastAPI
dependency on every `/tasks` route before the handler executes. It walks all rows with
`status IN ('active', 'faded')` that are not exempt and whose due date (if any) has not protected
them, and advances `status` forward (`active → faded → archived`) based on elapsed time since the
task's effective touch time.

**Rationale**: No background worker, scheduler, or cron dependency is needed — the app already reads
`/tasks` on every page load and view switch, so state is guaranteed fresh whenever the user looks at
it (satisfies SC-001: visible within one page load). This avoids introducing a new dependency
(APScheduler, Celery, etc.), which Principle VI (Minimal Dependencies) would require strong
justification for, and avoids Docker/process-management complexity Principle VII explicitly keeps out
of local dev.

**Alternatives considered**:
- Background thread/interval timer inside the FastAPI process — rejected: adds lifecycle complexity
  (start/stop with the app, thread-safety around the sqlite connection) for a single-user local app
  where lazy evaluation is indistinguishable in practice.
- Scheduled OS-level cron job — rejected: out of scope per Principle IX (No CI/CD unless requested)
  and overkill for a single-user SQLite app.

## R2: Status modeling

**Decision**: Extend the existing flat `status` column to a 4-value enum:
`active | faded | archived | completed`. `faded` is modeled as a sibling status value, not a separate
boolean flag layered on `active`. `GET /tasks?status=active` returns rows where
`status IN ('active', 'faded')`, ordered with non-faded rows first (each group ordered
`created_at DESC`), matching FR-004. `GET /tasks?status=archived` is a new filter value.

**Rationale**: A single enum keeps every query a simple `WHERE status = ...` / `IN (...)` filter and
keeps the state machine (active → faded → archived, plus revive-back-to-active) explicit and
readable (Principle IV, XIII), rather than reasoning about two independent flags
(`status` × `is_faded`) whose combinations would need to be validated against each other.

**Alternatives considered**: Separate `is_faded` boolean on top of the existing 2-value status —
rejected: creates invalid-combination risk (e.g., `is_faded=true` with `status=completed`) and more
branching in every query.

## R3: Schema migration for the existing local database

**Decision**: `init_db()` performs an idempotent in-place migration: it inspects `tasks` via
`PRAGMA table_info`, and if the new columns (`last_touched_at`, `fading_exempt`, `due_date`) or the
widened `status` CHECK constraint are missing, it rebuilds the table (create new table with the new
schema → copy existing rows, backfilling `last_touched_at` from `created_at`/`completed_at` and
`fading_exempt = 0` → drop old table → rename) inside a transaction. This runs automatically the next
time the backend starts; no manual migration step is required.

**Rationale**: SQLite cannot `ALTER TABLE` a `CHECK` constraint, and the existing constraint
(`status IN ('active', 'completed')`) would reject the new `faded`/`archived` values. A local dev
database with existing task rows (`backend/bitir.db`) already exists, so silently dropping it would
be a destructive, unrequested action; a table-rebuild migration preserves existing data without
introducing a migration-framework dependency (Alembic, etc.), which Principle VI does not justify for
a single, one-time schema change.

**Alternatives considered**: Require the developer to delete `bitir.db` manually — rejected: loses
existing local task data and adds a manual step to `quickstart.md` that a lazy migration avoids
entirely.

## R4: Scope of "touch" given no task-edit feature exists

**Decision**: `last_touched_at` is updated exactly on: task creation, task completion, and task
revival. The spec's own wording lists "edited" as a touch type, but no endpoint or UI to edit an
existing task's title/duration/energy exists anywhere in the app today (specs 001-002 only support
create, list, and complete). Introducing a general task-edit feature is out of scope for a fading
feature and would be premature abstraction (Principle III). If/when a future feature adds task
editing, it MUST also update `last_touched_at` as a touch, per the spec's definition — documented as
a forward-looking note, not implemented here.

**Rationale**: Building an unrequested edit feature to satisfy one clause of a touch-definition
clarification would violate "no over-engineering, no speculative structure" (Principle III) and the
project's stated scope discipline (per prior specs' Assumptions sections, e.g. 002's "No changes to
task creation").

## R5: Surface for setting fading-exemption and due date on an existing task

**Decision**: A single, narrow endpoint — `PATCH /tasks/{task_id}/fading` — accepts an optional
`fading_exempt` boolean and/or an optional `due_date` (date or `null` to clear), and updates only
those fields. `due_date` MAY also be set at creation time via `POST /tasks`. This is intentionally
not a general task-edit endpoint (see R4) — it only ever touches the two fading-related fields.

**Rationale**: Keeps the new API surface minimal and single-purpose (Principle III: each module/route
a single well-defined responsibility) without building the broader edit capability R4 explicitly
defers.

## R6: Settings persistence

**Decision**: A single-row SQLite table `fading_settings` (`id = 1`, `fade_threshold_days`,
`archive_threshold_days`), seeded with defaults `7` and `21` on first `init_db()` run if absent.
Exposed via `GET /settings/fading` and `PUT /settings/fading` (rejecting
`archive_threshold_days <= fade_threshold_days` with a 422, per FR-017).

**Rationale**: Simplest possible persistence for a single global configuration value — no new
dependency, consistent with how the rest of the app already uses SQLite directly (no ORM).

## R7: Recommendation engine integration with faded tasks

**Decision**: `frontend/src/lib/recommendation.ts`'s `pickRecommendation` partitions suitable,
non-excluded candidates into non-faded and faded groups, applies the existing
shortest-duration/oldest-tiebreak selection to the non-faded group first, and only falls back to the
faded group if no non-faded candidate exists — satisfying FR-005 without changing `isSuitable`'s
duration/energy logic.

**Rationale**: `GET /tasks?status=active` (per R2) now returns both `active` and `faded` rows in one
list, exactly the shape the recommendation engine already consumes; a pure partition-then-select step
is the smallest change that satisfies the priority ordering requirement.

## R8: Archive view and revive action

**Decision**: Reuse the existing `TaskList`/`TaskListItem`/`EmptyState` components (as the Completed
view already does) for a new "Archive" tab, passing a `revive` callback instead of `complete`.
`TaskListItem` gains an optional `onRevive` prop shown whenever a task's status is `faded` or
`archived`, alongside the existing `onComplete` prop (shown only for `active`/`faded`, never
`archived`).

**Rationale**: Matches the established UI pattern (Principle III: consistent, non-duplicated
structure) from the Active/Completed toggle already in `App.tsx`.

## R9: Settings UI

**Decision**: A small `FadingSettingsModal` component, structurally mirroring the existing
`AddTaskModal` (form, client-side validation, submit closes on success), opened from a "Settings"
control in the page header. Two integer-day inputs (fade threshold, archive threshold) with the same
inline-error pattern `AddTaskModal` already uses for invalid input.

**Rationale**: Reuses an established, already-reviewed interaction pattern rather than introducing a
new modal paradigm or a dependency like a routing library for a dedicated settings page.
