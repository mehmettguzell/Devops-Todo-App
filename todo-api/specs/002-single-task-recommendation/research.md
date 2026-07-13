# Phase 0 Research: Single-Task Recommendation Engine

No `NEEDS CLARIFICATION` markers remain in the Technical Context — all decisions below were
straightforward given the existing 001 skeleton and the spec's confirmed Clarifications/Assumptions.
Documented here for traceability.

## Decision: No new backend endpoint

**Decision**: Compute suitability filtering, single-task selection, and "not now" cycling entirely
client-side in the frontend, using the active task list already fetched via the existing
`GET /tasks?status=active` endpoint.

**Rationale**: The spec's own Assumptions state the recommendation input and cycle are transient,
non-persisted UI state that resets on reload. The full set of active tasks (with `estimated_duration_minutes`
and `energy_level`) is already loaded into the frontend's `activeTasks` state in `App.tsx`. Filtering
and picking one task from an in-memory array of "tens, not thousands" of items (per spec Scale/Scope)
is trivial and instant — adding a `/tasks/recommendation` endpoint would duplicate logic across two
layers, add a network round trip, and violate Principle VI (Minimal Dependencies) / Principle III
(no speculative structure) for zero practical benefit.

**Alternatives considered**:
- A `GET /tasks/recommend?minutes=&energy=` backend endpoint — rejected: adds backend complexity
  (query params, response shape, re-implementing the same filter/sort logic in Python) for a
  computation the frontend can already do instantly with data it holds.
- Server-side tracking of the "declined this cycle" set — rejected: the spec explicitly scopes this
  to a single client session with no persistence; server-side tracking would need a session concept
  that doesn't otherwise exist in this single-user app.

## Decision: Recommendation logic as a pure TypeScript module

**Decision**: Implement suitability filtering and selection as pure functions in
`frontend/src/lib/recommendation.ts`, taking `(tasks: Task[], input: { minutes: number; energy: EnergyLevel }, excludedIds: Set<number>)` and returning the next recommended task (or `undefined`).

**Rationale**: Keeps the selection algorithm (energy-order comparison, duration/energy filter,
shortest-duration-first with oldest-added tiebreak) independently readable and trivially testable in
isolation from React state/rendering, per Principle III (modular) and Principle IV (readable, single
responsibility).

**Alternatives considered**:
- Inlining the filter/sort logic directly inside the `RecommendationPanel` component — rejected:
  mixes UI event handling with selection logic, harder to read, violates "components must be short
  and do one thing" (Principle IV).

## Decision: Energy ordering representation

**Decision**: Represent the low/medium/high energy scale as an ordered array (`["low", "medium", "high"]`)
and compare tasks' `energy_level` index against the entered energy's index (`task index <= input index`)
to implement the confirmed "current energy and below" rule.

**Rationale**: Simplest possible representation of an ordinal 3-value scale without introducing a
numeric field on the `Task` type or a mapping library; matches how `EnergyLevel` is already defined
as a fixed union type in `frontend/src/api/tasks.ts`.

**Alternatives considered**: Adding a numeric `energyRank` field to the `Task` interface — rejected:
would touch the shared `Task` type/contract for a concern that's local to this one feature; an
inline ordered array is sufficient and self-contained in `lib/recommendation.ts`.
