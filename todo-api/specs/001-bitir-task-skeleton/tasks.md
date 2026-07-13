---

description: "Task list for feature implementation"
---

# Tasks: Bitir — Active Task List Skeleton

**Input**: Design documents from `/specs/001-bitir-task-skeleton/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tasks-api.yaml, quickstart.md

**Tests**: Not included — no tests were explicitly requested for this feature (constitution Principle VIII).

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Paths are relative to repository root, matching plan.md's Project Structure (`backend/`, `frontend/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the backend/frontend split and baseline tooling per plan.md.

- [X] T001 Create `backend/` directory and relocate the existing `main.py` and `pyproject.toml` into it (`backend/main.py`, `backend/pyproject.toml`), updating `backend/pyproject.toml`'s `readme`/paths as needed so `uv sync` still works from `backend/`
- [X] T002 Scaffold `frontend/` as a Vite + React + TypeScript project (`frontend/package.json`, `frontend/index.html`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/src/main.tsx`), depending only on `react`, `react-dom`, `typescript`, and `vite` (no router, state-management, or UI-kit dependencies, per plan.md's Minimal Dependencies gate)
- [X] T003 [P] Create `backend/.env.example` documenting `DATABASE_PATH` (default e.g. `bitir.db`) and `CORS_ALLOWED_ORIGIN` (default e.g. `http://localhost:5173`)
- [X] T004 [P] Create `frontend/.env.example` documenting `VITE_API_BASE_URL` (default e.g. `http://localhost:8000`)
- [X] T005 [P] Create a root `.gitignore` covering `backend/.venv/`, `backend/__pycache__/`, `backend/*.db`, `backend/.env`, `frontend/node_modules/`, `frontend/dist/`, `frontend/.env`

**Checkpoint**: `backend/` and `frontend/` exist as independently runnable siblings with no framework code yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story depends on — DB schema, shared models, app wiring, and the frontend shell.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Implement SQLite schema initialization (create the `tasks` table per data-model.md: `id`, `title`, `estimated_duration_minutes`, `energy_level`, `status`, `created_at`, `completed_at`) and a connection helper, reading the DB path from `DATABASE_PATH`, in `backend/db.py`
- [X] T007 [P] Implement Pydantic models `TaskCreate`, `Task`, and the `EnergyLevel`/`TaskStatus` enums per `contracts/tasks-api.yaml`, including `title` non-empty and `estimated_duration_minutes > 0` validation, in `backend/models.py`
- [X] T008 Wire the FastAPI app in `backend/main.py`: initialize the DB on startup (T006), add `CORSMiddleware` allowing `CORS_ALLOWED_ORIGIN`, and include the (not-yet-created) `backend/routes/tasks.py` router
- [X] T009 [P] Create an empty `backend/routes/tasks.py` with an `APIRouter` (prefix `/tasks`) and an empty `backend/services/tasks.py` module, so both are ready for story-specific functions
- [X] T010 [P] Implement the shared frontend API client scaffold — `Task`/`EnergyLevel` TypeScript types and a `request()` helper reading `VITE_API_BASE_URL` — in `frontend/src/api/tasks.ts`
- [X] T011 [P] Implement the `App.tsx` shell with active/completed view-toggle state (no data fetching yet) in `frontend/src/App.tsx`
- [X] T012 [P] Implement the global light, spacious theme (generous whitespace, light background, calm typography per FR-011) in `frontend/src/styles/global.css` and import it in `frontend/src/main.tsx`

**Checkpoint**: Backend boots and serves an empty `/tasks` router; frontend renders an empty shell with the calm theme applied. User story implementation can now begin.

---

## Phase 3: User Story 1 - Capture a task quickly (Priority: P1) 🎯 MVP

**Goal**: A user can click "Add task", fill in title/duration/energy in a modal, submit, and see the task appear in the active list.

**Independent Test**: Open the app, click "Add task", fill in the modal, submit, and confirm the new task appears in the active task list showing its title, duration, and energy level.

### Implementation for User Story 1

- [X] T013 [US1] Implement `create_task(title, estimated_duration_minutes, energy_level)` in `backend/services/tasks.py`, inserting a row with `status="active"` and `created_at=now()`
- [X] T014 [US1] Implement `POST /tasks` in `backend/routes/tasks.py`: validate via `TaskCreate` (422 on missing/invalid `title`, `estimated_duration_minutes`, or `energy_level` per FR-005), call T013, return 201 with the created `Task`
- [X] T015 [P] [US1] Implement `createTask(input)` calling `POST /tasks` in `frontend/src/api/tasks.ts`
- [X] T016 [P] [US1] Implement `TaskListItem.tsx` (renders a single task's title, estimated duration, and energy level) in `frontend/src/components/TaskListItem.tsx`
- [X] T017 [US1] Implement `TaskList.tsx` (renders a list of `TaskListItem`s from a `tasks` prop) in `frontend/src/components/TaskList.tsx` (depends on T016)
- [X] T018 [US1] Implement `AddTaskModal.tsx`: form with title/duration/energy fields, client-side required-field check, calls `createTask` (T015) on submit, shows the field-level error and stays open on a 422 response, closes and reports the created task on success, per FR-003–FR-006 and the Edge Cases (empty title / missing field) in `frontend/src/components/AddTaskModal.tsx`
- [X] T019 [US1] Wire the "Add task" button and `AddTaskModal` (T018) into `frontend/src/App.tsx`: open the modal on click, and on successful submission prepend the new task to the active-tasks list state and render it via `TaskList` (T017)

**Checkpoint**: Capturing a task via the modal works end-to-end and the task is visible in the active list.

---

## Phase 4: User Story 2 - See only what's actionable right now (Priority: P1)

**Goal**: The main page shows the user's persisted active tasks as a simple, newest-first list, with a calm empty state when there are none.

**Independent Test**: Seed one or more active tasks (e.g., via the API), open/reload the main page, and confirm it renders exactly those tasks — title, estimated duration, and energy level — newest-first, sourced from the server rather than local-only state.

### Implementation for User Story 2

- [X] T020 [US2] Implement `list_active_tasks()` in `backend/services/tasks.py`, returning tasks with `status="active"` ordered by `created_at DESC`
- [X] T021 [US2] Implement `GET /tasks?status=active|completed` in `backend/routes/tasks.py` (default `status=active`), calling T020 for the `active` branch (completed branch added in US4) and returning the list per `contracts/tasks-api.yaml`
- [X] T022 [P] [US2] Implement `listTasks(status)` calling `GET /tasks?status=...` in `frontend/src/api/tasks.ts`
- [X] T023 [P] [US2] Implement `EmptyState.tsx` (accepts a message, renders a calm empty-state placeholder) in `frontend/src/components/EmptyState.tsx`
- [X] T024 [US2] In `frontend/src/App.tsx`, fetch active tasks via `listTasks("active")` (T022) on mount, replace the US1 local-only list source with this server-fetched state, and render `EmptyState` (T023) when it's empty instead of an empty `TaskList`

**Checkpoint**: The active list reflects server state (persists across reload), is correctly ordered, and shows an empty state when appropriate. Combined with US1, tasks can be captured and reviewed.

---

## Phase 5: User Story 3 - Finish a task and feel momentum (Priority: P2)

**Goal**: A user can mark an active task complete with one click; it disappears from the active list immediately, and re-marking it is a safe no-op.

**Independent Test**: Seed an active task, trigger its "mark complete" control, confirm it's immediately removed from the active list, and confirm a repeated completion request on the same task does not error or duplicate (verify via `GET /tasks?status=completed`).

### Implementation for User Story 3

- [X] T025 [US3] Implement `complete_task(task_id)` in `backend/services/tasks.py`: if the task is `active`, set `status="completed"` and `completed_at=now()`; if it's already `completed`, leave it unchanged (idempotent no-op); raise a not-found error if `task_id` doesn't exist
- [X] T026 [US3] Implement `PATCH /tasks/{task_id}/complete` in `backend/routes/tasks.py`, calling T025 and returning 200 with the updated `Task`, or 404 if not found, per `contracts/tasks-api.yaml`
- [X] T027 [P] [US3] Implement `completeTask(taskId)` calling `PATCH /tasks/{task_id}/complete` in `frontend/src/api/tasks.ts`
- [X] T028 [US3] Add a "mark complete" control to `TaskListItem.tsx` (T016), visible only for active-list items, that calls an `onComplete` callback prop
- [X] T029 [US3] In `frontend/src/App.tsx`, pass an `onComplete` handler to active `TaskListItem`s that calls `completeTask` (T027) and removes the task from the active-tasks state immediately on success, guarding against double-invocation from rapid repeated clicks

**Checkpoint**: Completing a task removes it from the active list instantly; US1+US2+US3 together deliver the core "capture → focus → finish" loop.

---

## Phase 6: User Story 4 - Review what's been finished (Priority: P3)

**Goal**: A separate completed view lists finished tasks, most-recently-completed first, with a calm empty state when none exist.

**Independent Test**: Mark one or more tasks complete, navigate to the completed view, and confirm they appear there (title, estimated duration, energy level) most-recently-completed-first, separate from the active list; with none completed, confirm the empty state renders.

### Implementation for User Story 4

- [X] T030 [US4] Implement `list_completed_tasks()` in `backend/services/tasks.py`, returning tasks with `status="completed"` ordered by `completed_at DESC`
- [X] T031 [US4] Extend `GET /tasks?status=completed` in `backend/routes/tasks.py` (T021) to call T030 for the `completed` branch
- [X] T032 [US4] Add a navigation control (e.g., "Active" / "Completed" tabs) to `frontend/src/App.tsx`, toggling the view state established in T011
- [X] T033 [US4] In `frontend/src/App.tsx`, fetch and render the completed view using `listTasks("completed")` (T022), `TaskList`/`TaskListItem` (T016/T017, completion control hidden) and `EmptyState` (T023) when there are no completed tasks

**Checkpoint**: All four user stories work together — capture, focus on active work, finish it, and review what's been finished.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide consistency once all stories are complete.

- [X] T034 [P] Update `README.md` with prerequisites, backend setup/run steps, and frontend setup/run steps per constitution Principle XII (Concise Documentation)
- [X] T035 Run through every scenario in `quickstart.md` end-to-end (capture, persistence-on-reload, complete + idempotency, completed view, validation edge case) and fix any discrepancies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational (Phase 2) completion.
  - US1 (P1) and US2 (P1) have no dependency on each other in the backend, but US2's frontend task (T024) replaces the local-only list state US1 introduced (T019) — implement US1 before US2.
  - US3 (P2) depends on US1's `TaskListItem` (T016) and US2's active list rendering (T024) being in place to have something to complete against.
  - US4 (P3) depends on US2's `GET /tasks` route (T021) and shared `TaskList`/`EmptyState` components (T017/T023).
  - Recommended order: US1 → US2 → US3 → US4 (matches spec.md priorities).
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### Within Each User Story

- Backend service function before backend route.
- Backend route before the frontend API-client function that calls it.
- Shared components before the `App.tsx` wiring that uses them.
- Story complete and checkpoint-verified before moving to the next priority.

### Parallel Opportunities

- Setup: T003, T004, T005 can run in parallel (different files).
- Foundational: T007, T009, T010, T011, T012 can run in parallel once T006/T008 are sequenced (T007 has no dependency on T006/T008 and can start immediately).
- US1: T015 and T016 can run in parallel (different files, no shared dependency).
- US2: T022 and T023 can run in parallel.
- US3: T027 can run in parallel with T028 (different files).
- Different user stories should still be implemented in priority order (see above) since later stories build on earlier ones' components — true team-parallelism across stories is limited in this skeleton.

---

## Parallel Example: User Story 1

```bash
# After T013/T014 (backend) are done, these can proceed together:
Task: "Implement createTask(input) in frontend/src/api/tasks.ts"
Task: "Implement TaskListItem.tsx in frontend/src/components/TaskListItem.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Capture a task via the modal and see it in the list
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → capture works (MVP demo)
3. Add US2 → active list is real, persisted, ordered, with empty state
4. Add US3 → completing tasks works and feels immediate
5. Add US4 → completed work is reviewable
6. Polish → docs + full quickstart pass

---

## Notes

- [P] tasks touch different files with no unmet dependencies.
- [Story] labels map every user-story-phase task back to spec.md for traceability.
- No test tasks are included — not requested for this feature (constitution Principle VIII).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
