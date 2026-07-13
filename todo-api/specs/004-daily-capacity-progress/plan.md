# Implementation Plan: Daily Capacity & Finishing Progress

**Branch**: `004-daily-capacity-progress` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-daily-capacity-progress/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Completes Bitir's philosophy with realistic daily capacity and finish-first progress feedback. The
user enters a manual, day-scoped time budget; the app compares it against the total estimated
duration of active (including faded) tasks and shows a calm, non-blocking nudge when over-planned; it
always shows remaining capacity (budget minus completed-today duration, floored at zero) and makes
the recommendation engine respect that remaining capacity in addition to its existing time/energy
filter. On completion, and always visible, a same-day progress summary and a 7-day history +
consecutive-day streak celebrate finished work — built exclusively from completed tasks, never
referencing anything unfinished. The entire feature is computed client-side from the `activeTasks`
and `completedTasks` arrays the frontend already fetches, plus a `localStorage`-persisted daily
budget value — no backend endpoint, schema, or model changes (research.md R1), following the same
frontend-only pattern spec 002 established.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend only — no backend changes required)

**Primary Dependencies**: None added. Reuses the existing frontend's React/Vite setup, the existing
`frontend/src/api/tasks.ts` client (`listTasks`), and the existing `lib/recommendation.ts`
(`pickRecommendation`) unchanged. No new frontend or backend libraries — daily-capacity math and
history bucketing are plain TypeScript over data already in memory, and persistence uses the
browser's built-in `localStorage`.

**Storage**: No new backend storage. Today's budget is stored client-side in `localStorage`, keyed by
local calendar date (research.md R1, R3); everything else is derived on each render from the
already-fetched `activeTasks`/`completedTasks` arrays — nothing new is persisted server-side.

**Testing**: N/A — no tests are written unless explicitly requested (Principle VIII).

**Target Platform**: Modern evergreen browsers (existing Vite build output); no backend target
changes.

**Project Type**: Web application (existing `backend/` + `frontend/` split, Principle II) — this
feature is entirely frontend-only; the backend is completely unchanged.

**Performance Goals**: All calculations (sums, history bucketing, streak) run in-memory over
already-fetched arrays with no network round trip, so they must be imperceptibly fast at this app's
scale (tens of tasks) — satisfies SC-001 (<10s end-to-end, dominated by user input speed).

**Constraints**: Single-user, no auth (unchanged). No new dependencies (Principle VI). No backend
changes of any kind — must not modify the `Task` schema, any existing endpoint, or any existing
service/route file.

**Scale/Scope**: Same small scale as prior features (tens of tasks, single user, single browser — no
cross-device sync for the daily budget). Two new frontend components (`DailyCapacityPanel`,
`ProgressPanel`), one new pure logic module (`lib/dailyCapacity.ts`), and small, additive changes to
`App.tsx` to wire them in and cap the recommendation request's effective minutes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Python (FastAPI) Backend | No backend changes whatsoever; existing endpoints reused as-is | PASS (N/A) |
| II. React + TypeScript Frontend | New UI implemented entirely in the existing `frontend/` React+TS SPA; no server-rendered templates | PASS |
| III. Simple, Clean, Modular Architecture | New logic isolated in a pure `lib/dailyCapacity.ts` module; UI split into two single-purpose components (`DailyCapacityPanel` for budget/remaining/nudge, `ProgressPanel` for same-day + history celebration), mirroring the existing `lib/`+`components/` split from spec 002 | PASS |
| IV. Clean Code and Meaningful Naming | Enforced during implementation; no gate blocker at planning stage | PASS |
| V. RESTful API Design | No new endpoints introduced; no existing endpoint's contract changes | PASS (N/A) |
| VI. Minimal Dependencies | Zero new dependencies — uses only `localStorage` (browser built-in) and plain TypeScript over already-fetched data (research.md R1) | PASS |
| VII. Simple Docker for Local Dev Only | Not requested; no Docker changes | PASS (N/A) |
| VIII. No Tests Unless Requested | No tests planned; quickstart.md provides manual validation steps | PASS |
| IX. No CI/CD Unless Requested | No CI/CD planned | PASS |
| X. Environment Variables for Configuration | No new configuration introduced | PASS (N/A) |
| XI. No Secrets in Version Control | No secrets involved | PASS (N/A) |
| XII. Concise Documentation | README updated with a brief note on daily capacity and progress usage once implemented, kept minimal | PASS |
| XIII. Readability Over Cleverness | `lib/dailyCapacity.ts` written as small, explicit, named functions (sum, remaining, bucket, streak) rather than one dense composed expression | PASS |

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-daily-capacity-progress/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated for this feature — it introduces no new API surface
whatsoever (see research.md, Decision R1: no backend changes).

### Source Code (repository root)

```text
backend/
└── (unchanged — no files added or modified by this feature)

frontend/
├── src/
│   ├── App.tsx                        # extended: renders DailyCapacityPanel + ProgressPanel, caps recommendation request minutes by remaining capacity
│   ├── lib/
│   │   └── dailyCapacity.ts           # new: pure functions — local date keys, sums, remaining capacity, over-budget check, 7-day history bucketing, streak
│   └── components/
│       ├── DailyCapacityPanel.tsx     # new: budget entry (if unset) or remaining-capacity line + over-budget nudge (if set)
│       └── ProgressPanel.tsx          # new: same-day completed count/time + 7-day history with streak, completions-only
```

**Structure Decision**: Frontend-only addition to the existing web application split (constitution
Principle II), touching zero backend files — the feature reuses `frontend/src/api/tasks.ts`
(`listTasks`) and `frontend/src/lib/recommendation.ts` (`pickRecommendation`) exactly as they exist
today. New logic lives in a pure `lib/` module and two new presentational components alongside the
existing `components/` directory, matching the precedent spec 002 established for frontend-only
features.

## Complexity Tracking

*No violations — table intentionally omitted.*
