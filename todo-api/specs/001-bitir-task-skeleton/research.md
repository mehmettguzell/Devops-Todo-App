# Phase 0 Research: Bitir — Active Task List Skeleton

All items below were either resolved during `/speckit-clarify` (recorded in spec.md's Clarifications
section) or are standard-practice decisions with no open unknowns remaining. No
`NEEDS CLARIFICATION` markers remain in the Technical Context.

## 1. Persistence approach

- **Decision**: SQLite, single file, accessed via Python's stdlib `sqlite3` module with raw SQL
  (no ORM).
- **Rationale**: Spec requires server-side persistence (FR-014). SQLite needs no external database
  server, keeps setup to "run the app," and `sqlite3` is stdlib — no new dependency, satisfying
  Principle VI (Minimal Dependencies). A single `tasks` table is sufficient for one entity with no
  relationships.
- **Alternatives considered**:
  - PostgreSQL/MySQL — rejected: requires a running DB server/Docker service for a single-user
    skeleton; overkill for the current scope.
  - SQLAlchemy ORM over SQLite — rejected: adds a dependency and an abstraction layer for a single
    table with four simple operations (list active, list completed, create, complete); raw SQL is
    more readable at this scale (Principle IV/XIII).
  - JSON file on disk — rejected: SQLite gives transactional writes and simple filtering
    (`WHERE status = ?`) essentially for free, with equivalent operational simplicity.

## 2. Frontend stack & tooling

- **Decision**: React 18 + TypeScript, scaffolded with Vite, in a standalone `frontend/` directory.
- **Rationale**: Directly mandated by the constitution amendment (Principle II). Vite gives fast dev
  startup and a minimal, well-understood build pipeline.
- **Alternatives considered**: Next.js — rejected: brings server-side rendering / routing
  conventions the skeleton doesn't need, adds complexity beyond Principle VI's minimal-dependency
  bar. Plain HTML+JS — rejected: the constitution now mandates React+TypeScript for feature UIs.

## 3. View navigation (active ↔ completed)

- **Decision**: A single-page app with in-memory view state (e.g., `useState<'active'|'completed'>`)
  toggled by a nav control — no client-side routing library, no distinct URLs.
- **Rationale**: Only two views and no deep-linking requirement exists in the spec. Adding a router
  (e.g., react-router) for two toggled views would violate Principle VI (Minimal Dependencies)
  without adding user value at this stage.
- **Alternatives considered**: react-router — rejected for now as unjustified; can be introduced
  later if the app grows distinct routable pages.

## 4. Cross-origin requests (frontend dev server ↔ backend)

- **Decision**: FastAPI's built-in `CORSMiddleware`, allowing the frontend's dev origin (configurable
  via environment variable) to call the API.
- **Rationale**: Vite's dev server and FastAPI's `uvicorn` server run on different ports in local
  development; CORS must be explicitly enabled for `fetch` calls to succeed. `CORSMiddleware` ships
  with FastAPI — no new dependency.
- **Alternatives considered**: A dev-time proxy in Vite config — viable alternative, but explicit
  CORS configuration is simpler to reason about and works identically in any future deployment
  topology (Principle XIII — readability/predictability over cleverness).

## 5. API shape for task operations

- **Decision**: A single `/tasks` resource:
  - `GET /tasks?status=active|completed` — list, filtered and ordered server-side per the
    clarified ordering rules (active: newest-first; completed: most-recently-completed-first).
  - `POST /tasks` — create a task (title, estimated_duration_minutes, energy_level required).
  - `PATCH /tasks/{task_id}/complete` — mark a task completed; idempotent (a second call on an
    already-completed task is a no-op, not an error), matching the spec's edge-case requirement.
- **Rationale**: Matches Principle V (RESTful API Design: nouns + verbs, semantic status codes).
  Filtering/ordering server-side keeps the frontend simple (no client-side sort/filter logic) and
  matches Principle VI (Minimal Dependencies / minimal frontend logic).
- **Alternatives considered**: Separate `/tasks/active` and `/tasks/completed` endpoints — rejected:
  a query-parameter filter on one resource is more idiomatically RESTful and avoids duplicating
  response shape documentation.
