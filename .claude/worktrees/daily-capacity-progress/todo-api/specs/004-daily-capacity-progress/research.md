# Phase 0 Research: Daily Capacity & Finishing Progress

## R1: No backend changes — entirely frontend-computed

**Decision**: This feature introduces zero backend schema, endpoint, or model changes. Today's
budget is stored client-side (browser `localStorage`, keyed by local calendar date). Today's planned
total, remaining capacity, the over-budget nudge, the same-day progress summary, and the 7-day
history + streak are all computed in the frontend from data the app already fetches:
`activeTasks` (via the existing `GET /tasks?status=active`) and `completedTasks` (via the existing
`GET /tasks?status=completed`).

**Rationale**: Every input this feature needs — task `estimated_duration_minutes` and
`completed_at` — already exists in the `Task` shape the frontend already holds in memory (specs
001-003). The only genuinely new piece of state is "today's budget," which is explicitly
transient/manual-entry-per-day (per Clarifications) and scoped to a single browser for a single-user
local app — `localStorage` is sufficient and requires no new persistence layer, migration, or
endpoint. This directly follows the precedent set by spec 002 (Single-Task Recommendation), whose
plan.md explicitly chose "no new backend endpoint, no schema change, no new persistence" for the same
reasons, and satisfies constitution Principle VI (Minimal Dependencies) more strongly than any
backend-persisted alternative.

**Alternatives considered**:
- A backend `daily_capacity` table (date, budget_minutes) — rejected: adds a new table, model, and
  endpoint set for a value that is, per Clarifications, deliberately re-entered by the user each day
  and never needs to sync across devices for this single-user app; SQLite/FastAPI machinery would be
  pure overhead here.
- Deriving "today's budget" from a new field on `Task` — rejected: budget is a day-level concept
  with no relationship to any single task; forcing it onto the Task model would violate Principle III
  (single, well-defined responsibility per entity).

## R2: Recommendation-engine capacity cap is a call-site concern, not a selection-logic change

**Decision**: `frontend/src/lib/recommendation.ts`'s `pickRecommendation`/`isSuitable` remain
unchanged. In `App.tsx`, whenever a daily budget is set, the `minutes` value passed into
`pickRecommendation` is computed as `Math.min(enteredMinutes, remainingCapacityMinutes)` before the
call, rather than the user's raw entered value.

**Rationale**: `pickRecommendation` already filters candidates by "duration ≤ requested minutes"
(spec 002, FR-003). Feeding it an effective minutes value that's already capped by remaining daily
capacity satisfies FR-009 ("MUST NOT recommend a task whose estimated duration exceeds today's
remaining capacity") with zero changes to an already-implemented, already-tested pure module —
keeping that module's responsibility exactly what it was (spec 002's Constitution Check: "Recommendation
logic isolated in a pure `lib/recommendation.ts` module").

**Alternatives considered**: Adding a `remainingCapacityMinutes` parameter directly to
`pickRecommendation` — rejected: conflates two independent concerns (per-request stated availability
vs. day-level budget tracking) inside one function signature when a `Math.min` at the call site
achieves the identical filtering result with less surface area to reason about.

## R3: Local calendar day boundaries computed from existing UTC timestamps

**Decision**: A `toLocalDateKey(isoString: string): string` helper converts any backend timestamp
(`created_at`, `completed_at`, both stored as UTC ISO-8601) into a `YYYY-MM-DD` key using the
browser's local timezone (via `Date` object accessors, not `toISOString()`, which is UTC). "Today,"
"the last 7 days," and streak day-boundaries are all computed by comparing these local date keys.

**Rationale**: The spec's Assumptions explicitly state day boundaries use local calendar days,
"consistent with how the existing fading feature already reasons about day-based thresholds." The
fading feature's backend sweep already deals in UTC internally; this feature is a pure display/derivation
layer on top of existing data, so doing the local-day conversion client-side (where "local" is
unambiguous — the browser's timezone) is simpler than introducing timezone-aware logic on the
backend for a feature that touches no backend code at all (R1).

## R4: Component structure mirrors the existing `lib/` + `components/` split

**Decision**: One new pure module, `frontend/src/lib/dailyCapacity.ts`, holds every calculation
(today's key, sums, remaining capacity, history bucketing, streak). Two new presentational
components consume it: `DailyCapacityPanel.tsx` (User Stories 1-3: budget entry, remaining capacity,
over-budget nudge) and `ProgressPanel.tsx` (User Stories 4-5: same-day summary and 7-day
history/streak).

**Rationale**: Matches the established pattern from spec 002 (`lib/recommendation.ts` as pure logic,
`RecommendationPanel`/`RecommendationCard` as presentation) — constitution Principle III (Simple,
Clean, Modular Architecture) and Principle IV (functions/components short, single-purpose). Splitting
into two components rather than one reflects their distinct concerns (budget-vs-plan comparison vs.
completions-only celebration) while keeping the total new-file count small.

## R5: History depth and streak computed by walking the existing completed-tasks list

**Decision**: `buildHistory(completedTasks, days = 7)` buckets `completedTasks` (already fully
fetched via the existing `listTasks("completed")` call) into the last 7 local-day keys, counting
tasks and summing duration per day. `computeStreak(history)` walks backward from today (falling back
to yesterday if today has zero completions yet, per spec User Story 5 Acceptance Scenario 5),
counting consecutive days with at least one completion until it hits a zero-completion day.

**Rationale**: No new backend query is needed (R1) — the frontend already holds the full completed
list in `completedTasks` state. Bucketing and streak-walking are both pure, small functions operating
on data already in memory, consistent with R4.

**Alternatives considered**: Having the backend return a pre-aggregated "last 7 days" summary —
rejected: would require a new endpoint solely to reshape data the frontend already has, contradicting
R1's rationale; at this app's scale (tens of completed tasks for a single user), client-side bucketing
has no meaningful performance cost.
