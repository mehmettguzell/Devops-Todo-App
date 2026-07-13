---

description: "Task list for feature implementation"
---

# Tasks: Task Fading & Archival

**Input**: Design documents from `/specs/003-task-fading/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tasks-api.yaml, contracts/settings-api.yaml, quickstart.md

**Tests**: Not included — no tests were explicitly requested for this feature (constitution Principle VIII).

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Paths are relative to repository root, matching plan.md's Project Structure (`backend/`, `frontend/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migrate the SQLite schema to support fading/archival and global settings, per research.md R3 and R6.

- [X] T001 Migrate the `tasks` table schema in `backend/db.py`: widen the `status` CHECK constraint to `active|faded|archived|completed` and add `last_touched_at` (TEXT, NOT NULL), `fading_exempt` (INTEGER, NOT NULL, DEFAULT 0), and `due_date` (TEXT, nullable) columns, via the idempotent rebuild-in-place migration described in research.md R3 (detect outdated schema via `PRAGMA table_info`, create a new table, copy existing rows backfilling `last_touched_at` from `COALESCE(completed_at, created_at)`, drop and rename), run automatically from `init_db()`
- [X] T002 [P] Create the `fading_settings` table in `backend/db.py` (single row `id = 1`, `fade_threshold_days` INTEGER NOT NULL, `archive_threshold_days` INTEGER NOT NULL), inserting the default row (`7`, `21`) on `init_db()` if the table is empty

**Checkpoint**: `backend/bitir.db` has the widened schema and a seeded settings row; existing task rows are preserved.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared models and the fade/archive evaluation engine every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Widen `TaskStatus` to `active | faded | archived | completed`, add `last_touched_at: datetime`, `fading_exempt: bool`, `due_date: date | None` to `Task`, and add a `TaskFadingUpdate` model (`fading_exempt: bool | None`, `due_date: date | None`, both optional) in `backend/model/models.py`, per contracts/tasks-api.yaml
- [X] T004 [P] Add `FadingSettings` (`fade_threshold_days: int`, `archive_threshold_days: int`) and `FadingSettingsUpdate` (same fields, required) Pydantic models in `backend/model/models.py`, per contracts/settings-api.yaml
- [X] T005 Implement `apply_fading_transitions()` in `backend/services/fading.py`: read the current `fading_settings` thresholds, then for every task row with `status IN ('active', 'faded')` and `fading_exempt = 0`, compute `effective_start` (= `due_date` when it is set, not in the future, and later than `last_touched_at`; otherwise `last_touched_at`), skip rows whose `due_date` is still in the future, and advance `status` to `faded` or `archived` when the elapsed time since `effective_start` meets the archive/fade threshold respectively, per data-model.md's "Effective fade/archive clock" (depends on T001, T002, T003)
- [X] T006 Wire `apply_fading_transitions()` (T005) as a FastAPI dependency on the `tasks` router in `backend/routes/tasks.py`, so every `/tasks*` request evaluates pending transitions before the handler runs (depends on T005)
- [X] T007 [P] Update `create_task()` in `backend/services/tasks.py` to set `last_touched_at = created_at` on insert and accept an optional `due_date` parameter, so newly-created tasks start fresh and are never immediately eligible for fading (depends on T001, T003)
- [X] T008 [P] Extend the `Task` interface, `TaskStatus` type, and `TaskCreateInput` in `frontend/src/api/tasks.ts`: `status: "active" | "faded" | "archived" | "completed"`, `last_touched_at: string`, `fading_exempt: boolean`, `due_date: string | null`, and an optional `due_date` on `TaskCreateInput`

**Checkpoint**: The schema, models, and sweep engine exist and run on every request. No user-visible behavior has changed yet — story phases below expose it.

---

## Phase 3: User Story 1 - See neglect without being nagged (Priority: P1) 🎯 MVP

**Goal**: Faded tasks remain fully interactive but render visually muted, sort after fresh tasks, and are only recommended once no fresh candidate remains — with no notification of any kind.

**Independent Test**: Seed one fresh and one artificially-backdated active task (past the fade threshold); load the active list and confirm the stale task renders muted and ordered after the fresh one, with no dialog/toast/badge appearing.

### Implementation for User Story 1

- [X] T009 [US1] Update `list_active_tasks()` in `backend/services/tasks.py` to select rows where `status IN ('active', 'faded')`, ordered with non-faded rows first and `created_at DESC` within each group, per FR-004 (depends on T001)
- [X] T010 [US1] Update `complete_task()` in `backend/services/tasks.py` to treat a `faded` task exactly like an `active` one (completes normally per Edge Cases), and raise a new `TaskArchivedError` when the task's status is `archived` (depends on T001, T009)
- [X] T011 [US1] In `backend/routes/tasks.py`'s `PATCH /tasks/{task_id}/complete`, catch `TaskArchivedError` (T010) and return 409, per contracts/tasks-api.yaml (depends on T010)
- [X] T012 [P] [US1] Add a muted/faded visual treatment (e.g. `.task-list-item--faded` — reduced opacity, softened text color) to `frontend/src/styles/global.css`
- [X] T013 [US1] In `frontend/src/components/TaskListItem.tsx`, apply the `task-list-item--faded` class (T012) when `task.status === "faded"`, keeping the existing `onComplete` control and all other interactions available
- [X] T014 [US1] Update `pickRecommendation()` in `frontend/src/lib/recommendation.ts` to partition suitable, non-excluded candidates into non-faded and faded groups, applying the existing shortest-duration/oldest-tiebreak selection to the non-faded group first and falling back to the faded group only when it's empty, per research.md R7 (depends on T008)

**Checkpoint**: Faded tasks are visually distinguishable, correctly ordered, remain fully actionable, and are deprioritized (never hidden) in recommendations — with zero interruptive UI.

---

## Phase 4: User Story 2 - Old, forgotten work quietly leaves the list (Priority: P1)

**Goal**: A task untouched past the archive threshold automatically leaves the active list and recommendation engine, remaining visible only in a dedicated Archive view.

**Independent Test**: Seed a task backdated past the archive threshold; confirm it disappears from the active list and any recommendation, and appears in a new Archive view with title/duration/energy.

### Implementation for User Story 2

- [X] T015 [US2] Implement `list_archived_tasks()` in `backend/services/tasks.py`, returning rows with `status = 'archived'` ordered by `last_touched_at DESC` (depends on T001)
- [X] T016 [US2] Extend the `status` query parameter in `GET /tasks` (`backend/routes/tasks.py`) to `Literal["active", "completed", "archived"]`, calling T015 for the new `archived` branch, per contracts/tasks-api.yaml (depends on T015)
- [X] T017 [P] [US2] Add `"archived"` to the accepted `TaskStatus`/`listTasks()` values in `frontend/src/api/tasks.ts` (depends on T008)
- [X] T018 [US2] Add an "Archive" tab to the view nav in `frontend/src/App.tsx`, fetching archived tasks via `listTasks("archived")` (T017) on mount/tab-switch and rendering them with `TaskList`/`EmptyState` (no complete action) (depends on T017)

**Checkpoint**: Archived tasks are fully out of the way of the active list and recommendations, but reviewable in their own view. Combined with US1, neglect now has real consequences that stay reversible.

---

## Phase 5: User Story 3 - Bring a task back to life (Priority: P1)

**Goal**: A faded or archived task can be revived to a fresh active state in a single action.

**Independent Test**: Seed one faded and one archived task; trigger revive on each; confirm both become active, render fresh (not faded), and are immediately recommendation-eligible.

### Implementation for User Story 3

- [X] T019 [US3] Implement `revive_task(task_id)` in `backend/services/fading.py`: sets `status = 'active'` and `last_touched_at = now()`; raises `TaskNotFoundError` if missing; raises a new `TaskCompletedError` if the task's status is `completed` (revive does not apply to completed tasks, per contracts/tasks-api.yaml) (depends on T001, T005)
- [X] T020 [US3] Implement `PATCH /tasks/{task_id}/revive` in `backend/routes/tasks.py`, calling T019, returning 200 with the updated task, 404 if not found, 409 if completed
- [X] T021 [P] [US3] Implement `reviveTask(taskId)` calling `PATCH /tasks/{task_id}/revive` in `frontend/src/api/tasks.ts` (depends on T008)
- [X] T022 [US3] Add a "Revive" control to `frontend/src/components/TaskListItem.tsx`, shown whenever `task.status` is `"faded"` or `"archived"`, invoking an `onRevive` callback prop (depends on T013)
- [X] T023 [US3] Wire `onRevive` in `frontend/src/App.tsx` for both the active list (faded tasks) and the Archive view (T018): call `reviveTask` (T021), update the task to fresh/active in `activeTasks`, and remove it from `archivedTasks` if it was there (depends on T021, T022, T018)

**Checkpoint**: Any faded or archived task can be revived in one action, indistinguishable afterward from a brand-new task. US1–US3 together deliver the full quiet-neglect-and-recovery loop.

---

## Phase 6: User Story 4 - Protect tasks that are important but slow-moving (Priority: P2)

**Goal**: A task marked exempt never fades or archives, regardless of elapsed untouched time, until the exemption is removed.

**Independent Test**: Mark a task exempt, backdate it past both thresholds, confirm it stays fresh; remove the exemption and confirm it becomes subject to fading again from that point.

### Implementation for User Story 4

- [X] T024 [US4] Implement `update_task_fading(task_id, fading_exempt=None)` in `backend/services/fading.py`: applies the provided `fading_exempt` value; if set to `true` on a currently `faded`/`archived` task, also sets `status = 'active'` and `last_touched_at = now()`; if set from `true` to `false`, resets `last_touched_at = now()` regardless of current status, per FR-013 (depends on T001, T003)
- [X] T025 [US4] Implement `PATCH /tasks/{task_id}/fading` in `backend/routes/tasks.py` accepting `TaskFadingUpdate` (T003), calling T024, returning 200 with the updated task, 404 if not found, 422 if the request body has no fields set, per contracts/tasks-api.yaml (depends on T024)
- [X] T026 [P] [US4] Implement `updateTaskFading(taskId, input)` calling `PATCH /tasks/{task_id}/fading` in `frontend/src/api/tasks.ts` (depends on T008)
- [X] T027 [US4] Add an exemption toggle ("Pin") control to `frontend/src/components/TaskListItem.tsx`, shown for `active`/`faded` tasks, reflecting `task.fading_exempt` and invoking an `onToggleExempt` callback prop (depends on T013)
- [X] T028 [US4] Wire `onToggleExempt` in `frontend/src/App.tsx`: call `updateTaskFading` (T026) with the toggled `fading_exempt` value and replace the task in `activeTasks` with the response (depends on T026, T027)

**Checkpoint**: Exempt tasks are immune to fading/archival; removing the exemption resumes normal timing from that moment, not from before the exemption was set.

---

## Phase 7: User Story 5 - Give a task a due date so it stays put automatically (Priority: P2)

**Goal**: A task with an unexpired due date is automatically protected from fading/archival, the same as manual exemption, without any extra step.

**Independent Test**: Create a task with a future due date, backdate it past both thresholds, confirm it stays fresh; move its due date to the past and confirm it becomes subject to normal fading from that date forward.

### Implementation for User Story 5

- [X] T029 [US5] Accept and persist `due_date` in `create_task()` (T007) and `POST /tasks` (`backend/routes/tasks.py`, via `TaskCreate`), per contracts/tasks-api.yaml (depends on T007)
- [X] T030 [US5] Extend `update_task_fading()` (T024) and `PATCH /tasks/{task_id}/fading` (T025) to accept and persist a `due_date` update (including clearing it via `null`), applying the same "return to active if now protected" rule used for `fading_exempt` when a future `due_date` is set on a `faded`/`archived` task (depends on T024, T025)
- [X] T031 [P] [US5] Add an optional due-date field to `frontend/src/components/AddTaskModal.tsx`'s form, included in the `createTask` payload (depends on T008, T029)
- [X] T032 [US5] Add an inline due-date control to `frontend/src/components/TaskListItem.tsx` (visible for `active`/`faded` tasks) invoking an `onSetDueDate` callback, wired in `frontend/src/App.tsx` via `updateTaskFading` (T026) to update the task in `activeTasks` with the response (depends on T026, T027)

**Checkpoint**: Due-dated tasks are automatically protected until their due date passes, then behave like any other task from that point forward. US4 and US5 together give users two independent ways to protect long-horizon work.

---

## Phase 8: User Story 6 - Tune the pace of fading (Priority: P3)

**Goal**: Fade and archive thresholds are user-configurable (in days) via a settings area, defaulting to 7/21.

**Independent Test**: Open settings, change both thresholds, save, and confirm subsequent fade/archive evaluations use the new values; confirm an invalid (archive ≤ fade) combination is rejected with a clear message.

### Implementation for User Story 6

- [X] T033 [US6] Implement `get_fading_settings()` and `update_fading_settings(fade_threshold_days, archive_threshold_days)` in `backend/services/settings.py`, rejecting `archive_threshold_days <= fade_threshold_days` via a new `InvalidFadingSettingsError`, per FR-017 (depends on T002, T004)
- [X] T034 [US6] Implement `GET /settings/fading` and `PUT /settings/fading` in `backend/routes/settings.py` (new `APIRouter`, prefix `/settings`), calling T033 and returning 422 on `InvalidFadingSettingsError`, per contracts/settings-api.yaml (depends on T033)
- [X] T035 [US6] Include the new settings router in `backend/main.py` (depends on T034)
- [X] T036 [P] [US6] Implement `getFadingSettings()` and `updateFadingSettings(input)` in `frontend/src/api/settings.ts` (depends on T008)
- [X] T037 [P] [US6] Implement `FadingSettingsModal.tsx` in `frontend/src/components/`: fade/archive threshold number inputs, client-side validation (archive > fade) before submit, mirroring `AddTaskModal`'s inline-error pattern (depends on T036)
- [X] T038 [US6] Add a "Settings" control to `frontend/src/App.tsx`'s header, opening `FadingSettingsModal` (T037) and closing it on successful save (depends on T037)

**Checkpoint**: All six user stories work together — neglect fades quietly, forgotten work archives itself, anything can be revived, important slow work can be protected by pin or due date, and the pace of it all is user-tunable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide consistency once all stories are complete.

- [X] T039 [P] Update `README.md` with a brief note on fading, the Archive view, exemption/due-date protection, and the fading settings area, per constitution Principle XII (Concise Documentation)
- [X] T040 Run through every scenario in `specs/003-task-fading/quickstart.md` end-to-end (using the `sqlite3` backdating steps) and fix any discrepancies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories.
- **User Stories (Phase 3–8)**: All depend on Foundational (Phase 2) completion.
  - US1, US2, US3 (all P1) build directly on the sweep (T005) and share no code with each other beyond it — US1 (fading) and US2 (archival) are independently implementable in either order; US3 (revive) is most naturally validated once US1/US2 exist to revive *from*, but its backend/frontend code has no hard dependency on US1's or US2's task-level code.
  - US4 (exempt) and US5 (due date) both extend the same `PATCH /tasks/{id}/fading` endpoint (T024/T025) — implement US4 first (introduces the endpoint), then US5 extends it, per the Notes below on same-file sequencing.
  - US6 (settings) only depends on Foundational (the sweep already reads the `fading_settings` table); it does not depend on US1–US5.
  - Recommended order: US1 → US2 → US3 → US4 → US5 → US6 (matches spec.md priorities).
- **Polish (Phase 9)**: Depends on all desired user stories being complete.

### Within Each User Story

- Backend service function before backend route.
- Backend route before the frontend API-client function that calls it.
- Shared components (`TaskListItem` faded class, T013) before later stories' props on the same component (`onRevive` T022, `onToggleExempt` T027, due-date control T032) — these touch the same file sequentially across US1/US3/US4/US5.
- Story complete and checkpoint-verified before moving to the next priority.

### Parallel Opportunities

- Setup: T001 and T002 touch the same file (`backend/db.py`) but different tables — safe to parallelize as separate migration steps, though sequencing them in one commit is also reasonable.
- Foundational: T003, T004, T007, T008 can run in parallel (different files); T005 depends on T001–T003, T006 depends on T005.
- US1: T012 (CSS) can run in parallel with T009–T011 (backend); T013 depends on T012.
- US2: T017 can run in parallel with T015–T016 (backend).
- US3: T021 can run in parallel with T019–T020 (backend).
- US4: T026 can run in parallel with T024–T025 (backend).
- US5: T031 can run in parallel with T029–T030 (backend).
- US6: T036 and T037 can run in parallel with each other and with T033–T035 (backend), though T037 depends on T036's client existing to wire against.
- `TaskListItem.tsx` and `App.tsx` are touched sequentially across US1/US3/US4/US5 — true parallelism across those stories is limited for that file, matching the pattern already established in specs 001–002.

---

## Parallel Example: Foundational Phase

```bash
# After T001/T002 (schema) are done, these can proceed together:
Task: "Widen TaskStatus and extend Task/TaskFadingUpdate in backend/model/models.py"
Task: "Add FadingSettings/FadingSettingsUpdate in backend/model/models.py"
Task: "Extend the Task interface and TaskCreateInput in frontend/src/api/tasks.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Backdate a task past the fade threshold and confirm it renders muted, ordered last, and recommended only after fresh alternatives
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → sweep engine ready, no visible change yet
2. Add US1 → fading is visible and felt in ordering/recommendation (MVP demo)
3. Add US2 → forgotten work actually leaves the list, into an Archive view
4. Add US3 → anything faded/archived can be revived in one action
5. Add US4 → important slow-moving work can be pinned exempt
6. Add US5 → due dates offer a second, automatic protection mechanism
7. Add US6 → the pace of fading becomes user-tunable
8. Polish → docs + full quickstart pass

---

## Notes

- [P] tasks touch different files with no unmet dependencies.
- [Story] labels map every user-story-phase task back to spec.md for traceability.
- No test tasks are included — not requested for this feature (constitution Principle VIII).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
