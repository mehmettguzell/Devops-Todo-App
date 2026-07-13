# Implementation Plan: Task Fading & Archival

**Branch**: `003-task-fading` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-task-fading/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Adds Bitir's second distinguishing mechanism: tasks that go untouched quietly fade (muted styling,
demoted ordering, lower recommendation priority) and, if still untouched, automatically archive out
of the active list and recommendation engine entirely. Users can revive a faded/archived task in one
action, exempt a task from fading, or protect it with a due date. Fade/archive thresholds default to
7/21 days and are user-configurable. All transitions are evaluated lazily on read (no scheduler) and
happen silently — no notifications, badges, or warnings. This touches both the backend (schema
extension, lazy sweep, three new endpoints) and the frontend (faded styling, Archive view, Settings
modal, recommendation-engine reprioritization).

## Technical Context

**Language/Version**: Python 3.13 (FastAPI backend, unchanged) + TypeScript 5.x / React 18 (frontend,
unchanged) — same stack as specs 001-002, no new language/runtime.

**Primary Dependencies**: None added on either side. Reuses FastAPI, Pydantic, and the stdlib
`sqlite3`/`datetime` on the backend; reuses the existing React/Vite setup and
`frontend/src/api/tasks.ts` client conventions on the frontend. No scheduler, ORM, migration
framework, or date library is introduced (Principle VI).

**Storage**: SQLite (`backend/bitir.db`, unchanged engine). The `tasks` table gains
`last_touched_at`, `fading_exempt`, `due_date` columns and a widened `status` CHECK constraint; a new
single-row `fading_settings` table holds the configurable thresholds. See research.md R3 for the
in-place migration approach that preserves existing local task data.

**Testing**: N/A — no tests are written unless explicitly requested (Principle VIII).

**Target Platform**: Same as 001-002 — modern evergreen browsers (frontend), any host that runs
Python 3.13 + FastAPI locally (backend). No deployment/platform changes.

**Project Type**: Web application (existing `backend/` + `frontend/` split, Principle II). This
feature touches both sides: backend schema/endpoints for fading state and settings, frontend UI for
faded styling, the Archive view, the Settings modal, and recommendation-engine reprioritization.

**Performance Goals**: The lazy fade/archive sweep (research.md R1) MUST complete within the same
request/response cycle as any `/tasks` call with no perceptible added latency at this app's scale
(tens of tasks, single user) — satisfies SC-001 (visible within one page load).

**Constraints**: Single-user, no auth (unchanged). No new dependencies (Principle VI). No background
scheduler/worker process (research.md R1). Existing `/tasks` list/create/complete behavior for
non-faded, non-archived tasks MUST remain unchanged (backward-compatible extension, not a rewrite).

**Scale/Scope**: Same small scale as 001-002 (tens of tasks, single user). Three new backend
endpoints (`/tasks/{id}/revive`, `/tasks/{id}/fading`, `/settings/fading` GET+PUT), one widened
endpoint (`GET /tasks?status=archived`), one new frontend view (Archive), one new frontend modal
(Settings), and targeted changes to existing components (`TaskListItem`, `lib/recommendation.ts`,
`AddTaskModal`, `App.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Python (FastAPI) Backend | All new backend logic (sweep, revive, fading-config, settings) implemented in the existing FastAPI app; no alternative framework | PASS |
| II. React + TypeScript Frontend | New UI (Archive view, Settings modal, faded styling) implemented in the existing `frontend/` React+TS SPA; no server-rendered templates | PASS |
| III. Simple, Clean, Modular Architecture | New backend logic split into `services/fading.py` (sweep + revive + per-task fading updates) and `services/settings.py` (global thresholds), separate from `services/tasks.py`; new frontend logic reuses existing `components/`/`lib/` module boundaries (no new layer) | PASS |
| IV. Clean Code and Meaningful Naming | Enforced during implementation; no gate blocker at planning stage | PASS |
| V. RESTful API Design | New endpoints follow existing noun-resource + verb-suffix convention (`/tasks/{id}/revive`, `/tasks/{id}/fading`) and a new `/settings/fading` resource; HTTP verbs and status codes used semantically (200/404/409/422) | PASS |
| VI. Minimal Dependencies | Zero new dependencies — sweep logic is plain Python `datetime` comparisons over existing `sqlite3` rows; no scheduler, ORM, or migration framework (research.md R1, R3) | PASS |
| VII. Simple Docker for Local Dev Only | Not requested; no Docker changes | PASS (N/A) |
| VIII. No Tests Unless Requested | No tests planned; quickstart.md provides manual validation steps | PASS |
| IX. No CI/CD Unless Requested | No CI/CD planned; ruled out as the mechanism for fade evaluation (research.md R1) | PASS |
| X. Environment Variables for Configuration | No new environment variables needed — fade/archive thresholds are runtime, user-editable data (via `/settings/fading`), not deployment configuration | PASS |
| XI. No Secrets in Version Control | No secrets involved | PASS (N/A) |
| XII. Concise Documentation | README updated with a brief note on fading, archive, and settings usage once implemented, kept minimal | PASS |
| XIII. Readability Over Cleverness | The sweep is written as explicit, readable Python comparisons (research.md R1, data-model.md "Effective fade/archive clock"), not a clever single SQL expression, specifically to keep it easy to reason about | PASS |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-task-fading/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── tasks-api.yaml    # Updated Task contract (supersedes 001's)
│   └── settings-api.yaml # New fading-settings contract
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── db.py                        # extended: migration to widen `status`, add last_touched_at/fading_exempt/due_date columns; create fading_settings table
├── model/
│   └── models.py                # extended: TaskStatus enum widened; Task gains last_touched_at/fading_exempt/due_date; new TaskFadingUpdate, FadingSettings, FadingSettingsUpdate
├── routes/
│   ├── tasks.py                 # extended: status query widened to include `archived`; sweep dependency; new PATCH /tasks/{id}/revive and PATCH /tasks/{id}/fading
│   └── settings.py              # new: GET/PUT /settings/fading
└── services/
    ├── tasks.py                 # extended: create_task accepts optional due_date, sets last_touched_at; list_active_tasks includes faded, ordered per FR-004; new list_archived_tasks; complete_task rejects archived tasks
    ├── fading.py                 # new: apply_fading_transitions() sweep, revive_task(), update_task_fading() (exempt/due_date)
    └── settings.py               # new: get_fading_settings(), update_fading_settings()

frontend/
├── src/
│   ├── App.tsx                        # extended: adds "Archive" view/tab, Settings modal trigger, wires revive/exempt handlers
│   ├── api/
│   │   ├── tasks.ts                   # extended: Task type gains status values/last_touched_at/fading_exempt/due_date; reviveTask(), updateTaskFading(); listTasks accepts "archived"
│   │   └── settings.ts                # new: getFadingSettings(), updateFadingSettings()
│   ├── lib/
│   │   └── recommendation.ts          # extended: pickRecommendation deprioritizes faded candidates (research.md R7)
│   └── components/
│       ├── TaskListItem.tsx           # extended: faded styling, onRevive/onToggleExempt props
│       ├── AddTaskModal.tsx           # extended: optional due-date field
│       └── FadingSettingsModal.tsx    # new: fade/archive threshold form, mirrors AddTaskModal's pattern
```

**Structure Decision**: Extends the existing `backend/` + `frontend/` split (Principle II) established
in 001-002; no new top-level directories. Backend fading logic is isolated into its own
`services/fading.py` and `services/settings.py` modules rather than growing `services/tasks.py`
unboundedly (Principle III). Frontend changes extend existing modules in place, following the same
`components/`/`lib/`/`api/` boundaries 001-002 already established, plus one new component
(`FadingSettingsModal.tsx`) and one new API module (`api/settings.ts`) for the new settings resource.

## Complexity Tracking

*No violations — table intentionally omitted.*
