# Implementation Plan: Single-Task Recommendation Engine

**Branch**: `002-single-task-recommendation` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-single-task-recommendation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Adds a recommendation area to Bitir's main page: the user enters their currently available time
(minutes) and energy level (low/medium/high), and the app surfaces exactly one suitable active task
(duration ≤ time, energy ≤ entered energy, shortest-duration-first with oldest-added tiebreak), with
three actions (complete, "not now" for another, dismiss) and a calm no-match message otherwise. The
entire feature is computed client-side in the frontend against the active task list the app already
fetches — no new backend endpoint, no schema change, and no new persistence, since suitability
filtering and cycle-declined tracking are pure, transient, in-memory computations over data the
frontend already holds. The existing `/tasks` REST contract (list + complete) is reused unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend only — no backend changes required)

**Primary Dependencies**: None added. Reuses the existing frontend's React/Vite setup and the
existing `frontend/src/api/tasks.ts` client (`listTasks`, `completeTask`). No new frontend libraries
(no state management, no date/random utility) and no new backend dependencies.

**Storage**: N/A — no new persistence. Recommendation input (time/energy) and the declined-tasks
"cycle" are transient React component state only, per spec Assumptions/Clarifications (cleared on
reload).

**Testing**: N/A — no tests are written unless explicitly requested (Principle VIII).

**Target Platform**: Modern evergreen browsers (existing Vite build output); no backend target
changes.

**Project Type**: Web application (existing frontend + backend split, constitution Principle II) —
this feature is frontend-only; the backend is unchanged.

**Performance Goals**: Recommendation computation MUST be instantaneous (pure in-memory filter/sort
over an already-fetched list, no network round trip) — satisfies SC-001 (<10s end-to-end, dominated
entirely by user input speed, not computation).

**Constraints**: Single-user, no auth (unchanged from 001). No new dependencies (Principle VI). Must
reuse the existing `/tasks` REST contract as-is — no new endpoints, no modification to the `Task`
schema.

**Scale/Scope**: Same small scale as 001 (tens of tasks, single user). One new UI area (recommendation
input + card) on the existing main page; no new routes/views.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Python (FastAPI) Backend | No backend changes; existing `/tasks` endpoints reused as-is | PASS (N/A) |
| II. React + TypeScript Frontend | New UI implemented in existing `frontend/` React+TS SPA; no server-rendered templates | PASS |
| III. Simple, Clean, Modular Architecture | Recommendation logic isolated in a pure `lib/recommendation.ts` module; UI split into a `RecommendationPanel` (input) and `RecommendationCard` (result) component, no coupling into unrelated modules | PASS |
| IV. Clean Code and Meaningful Naming | Enforced during implementation; no gate blocker at planning stage | PASS |
| V. RESTful API Design | No new endpoints introduced; existing `/tasks` resource contract untouched | PASS (N/A) |
| VI. Minimal Dependencies | Zero new dependencies — recommendation selection is plain TypeScript over the already-fetched task array | PASS |
| VII. Simple Docker for Local Dev Only | Not requested; no Docker changes | PASS (N/A) |
| VIII. No Tests Unless Requested | No tests planned | PASS |
| IX. No CI/CD Unless Requested | No CI/CD planned | PASS |
| X. Environment Variables for Configuration | No new configuration introduced (no new env vars needed) | PASS (N/A) |
| XI. No Secrets in Version Control | No secrets involved | PASS (N/A) |
| XII. Concise Documentation | README update only if the recommendation flow needs a usage note; kept minimal | PASS |
| XIII. Readability Over Cleverness | Enforced during implementation; no gate blocker at planning stage | PASS |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-single-task-recommendation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated for this feature — it introduces no new API surface (see
research.md, Decision: No new backend endpoint).

### Source Code (repository root)

```text
backend/
└── (unchanged — no files added or modified by this feature)

frontend/
├── src/
│   ├── App.tsx                        # extended: renders RecommendationPanel above the active list
│   ├── lib/
│   │   └── recommendation.ts          # pure functions: filter suitable tasks, pick one, pick next on "not now"
│   └── components/
│       ├── RecommendationPanel.tsx    # time/energy input form + orchestrates the recommendation flow
│       └── RecommendationCard.tsx     # shows the recommended task + complete/not-now/dismiss actions
```

**Structure Decision**: Frontend-only addition to the existing web application split (constitution
Principle II). No backend files are touched — the feature reuses `frontend/src/api/tasks.ts`
(`listTasks`, `completeTask`) exactly as they exist today. New logic lives in a pure `lib/` module
(no framework dependency, easy to reason about) and two new components alongside the existing
`components/` directory.

## Complexity Tracking

*No violations — table intentionally omitted.*
