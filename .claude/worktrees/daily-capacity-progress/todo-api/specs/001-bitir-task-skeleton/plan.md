# Implementation Plan: Bitir — Active Task List Skeleton

**Branch**: `001-bitir-task-skeleton` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bitir-task-skeleton/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Bitir's first skeleton delivers a single-user task manager: a calm, spacious main page listing active
tasks (title, estimated duration in minutes, energy level), an "Add task" modal to capture new tasks,
a one-click "mark complete" control that moves a task out of the active list, and a separate completed
view. Tasks persist server-side (SQLite) so they survive reloads/restarts. Per the amended
constitution (v1.1.0), this is built as a FastAPI backend (`backend/`, REST/JSON) paired with a React
+ TypeScript SPA (`frontend/`, Vite) — no ORM, no auth, no routing library, minimal dependencies
throughout.

## Technical Context

**Language/Version**: Python 3.13 (backend, per `pyproject.toml`); TypeScript 5.x + React 18 (frontend)

**Primary Dependencies**: Backend: FastAPI (`fastapi[standard]`, already present), Pydantic (bundled
with FastAPI), stdlib `sqlite3` (no ORM). Frontend: React, ReactDOM, TypeScript, Vite — no additional
runtime libraries (no router, no state management library, no CSS framework; plain CSS is sufficient
for a single-page, two-view skeleton).

**Storage**: SQLite, single file (`bitir.db`), accessed via Python's stdlib `sqlite3` module with raw
SQL — no ORM, per Principle VI (Minimal Dependencies). Path configurable via environment variable.

**Testing**: N/A — no tests are written unless explicitly requested (Principle VIII).

**Target Platform**: Backend: any host that runs Python 3.13 (served via `uvicorn`, already included
in `fastapi[standard]`). Frontend: modern evergreen browsers (Vite build output).

**Project Type**: Web application — frontend + backend split (constitution Principle II).

**Performance Goals**: No throughput target beyond typical single-user local use; UI actions (add,
complete) MUST feel instantaneous (no perceptible delay per SC-002 — target <100ms round trip on
localhost).

**Constraints**: Single-user, no authentication/authorization (per spec Assumptions). Minimal
dependencies (no ORM, no frontend router/state library). No Docker, tests, or CI/CD unless explicitly
requested (Principles VII–IX).

**Scale/Scope**: Single user, a small number of tasks (tens, not thousands). Two views (active,
completed) plus one modal. No pagination needed at this scale.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Python (FastAPI) Backend | Backend implemented in Python/FastAPI in `backend/`, extending existing `main.py` app | PASS |
| II. React + TypeScript Frontend | Frontend implemented as `frontend/` Vite React+TS SPA, REST/JSON only, no server-rendered templates | PASS |
| III. Simple, Clean, Modular Architecture | Backend split into routes/models/services; frontend split into components/pages/services; no cross-module coupling | PASS |
| IV. Clean Code and Meaningful Naming | Enforced during implementation; no gate blocker at planning stage | PASS |
| V. RESTful API Design | `/tasks` resource, nouns + HTTP verbs, semantic status codes, JSON responses (see contracts/) | PASS |
| VI. Minimal Dependencies | No ORM (stdlib `sqlite3`); no frontend router/state lib/UI kit added — plain CSS and `fetch` suffice for 2 views + 1 modal | PASS |
| VII. Simple Docker for Local Dev Only | Not requested for this feature; no Docker artifacts introduced | PASS (N/A) |
| VIII. No Tests Unless Requested | No tests planned | PASS |
| IX. No CI/CD Unless Requested | No CI/CD planned | PASS |
| X. Environment Variables for Configuration | Backend: `DATABASE_PATH` (or similar) via env var; Frontend: `VITE_API_BASE_URL` via env var; both documented in `.env.example` files | PASS |
| XI. No Secrets in Version Control | No secrets needed (no auth in this skeleton); `.env` files git-ignored | PASS |
| XII. Concise Documentation | README updated with backend + frontend setup/run instructions | PASS |
| XIII. Readability Over Cleverness | Enforced during implementation; no gate blocker at planning stage | PASS |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-bitir-task-skeleton/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tasks-api.yaml
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── main.py               # FastAPI app entrypoint (moved from repo root)
├── db.py                 # SQLite connection + schema initialization (stdlib sqlite3)
├── models.py              # Pydantic request/response models (Task, TaskCreate, EnergyLevel)
├── routes/
│   └── tasks.py           # /tasks router: list, create, mark-complete
└── services/
    └── tasks.py           # Task persistence + business logic (create, list by status, complete)

frontend/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx             # View switcher: active list ↔ completed view
│   ├── api/
│   │   └── tasks.ts         # fetch wrappers for the /tasks REST contract
│   ├── components/
│   │   ├── TaskList.tsx
│   │   ├── TaskListItem.tsx
│   │   ├── AddTaskModal.tsx
│   │   └── EmptyState.tsx
│   └── styles/
│       └── global.css       # light, spacious theme (whitespace-first)
└── .env.example
```

**Structure Decision**: Web application split (constitution Principle II / plan template Option 2).
The existing root-level `main.py` and `pyproject.toml` are relocated/adapted into `backend/` so the
backend and frontend are clear, independently runnable siblings. No `tests/` directories are scaffolded
(Principle VIII — not requested for this feature).

## Complexity Tracking

*No violations — table intentionally omitted.*
