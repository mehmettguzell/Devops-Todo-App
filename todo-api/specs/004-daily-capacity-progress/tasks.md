---

description: "Task list for feature implementation"
---

# Tasks: Daily Capacity & Finishing Progress

**Input**: Design documents from `/specs/004-daily-capacity-progress/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not included — no tests were explicitly requested for this feature (constitution Principle VIII).

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Paths are relative to repository root. This feature is frontend-only per plan.md — `backend/` is untouched.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the new daily-capacity module per plan.md. No new dependencies or scaffolding beyond this file — the existing frontend project (001-003) already provides everything else.

- [ ] T001 Create `frontend/src/lib/dailyCapacity.ts` with an exported `DailyHistoryDay` type (`{ dateKey: string; completedCount: number; completedMinutes: number }`) per data-model.md

**Checkpoint**: The daily-capacity module exists as an empty shell ready for logic.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The local-date and summation primitives every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Implement `todayKey()` and `toLocalDateKey(isoString)` in `frontend/src/lib/dailyCapacity.ts`: both return `YYYY-MM-DD` keys derived from the browser's local timezone (not UTC), per research.md R3 (depends on T001)
- [ ] T003 [P] Implement `sumDurationMinutes(tasks: Task[])` in `frontend/src/lib/dailyCapacity.ts`: sums `estimated_duration_minutes` over the given tasks (depends on T001)

**Checkpoint**: Local-date and summation primitives exist and are ready for story-specific functions.

---

## Phase 3: User Story 1 - Set a realistic budget for today (Priority: P1) 🎯 MVP

**Goal**: The user enters today's time budget once; it persists for the rest of the day without being asked again.

**Independent Test**: Open the app, enter a daily time budget (e.g., 3 hours), reload the page, and confirm the previously entered budget is still in effect rather than being asked for again.

### Implementation for User Story 1

- [ ] T004 [US1] Implement `getStoredBudgetMinutes(dateKey)` and `setStoredBudgetMinutes(dateKey, minutes)` in `frontend/src/lib/dailyCapacity.ts`, persisting to `localStorage` under a key scoped to `dateKey` (depends on T002)
- [ ] T005 [US1] Implement `DailyCapacityPanel.tsx` in `frontend/src/components/`: accepts the current budget (or `null`) and an `onBudgetSet` callback; when unset, renders a simple form (hours/minutes-friendly input) that converts to minutes and calls `onBudgetSet` on submit, per FR-001/FR-002
- [ ] T006 [US1] Wire `DailyCapacityPanel` (T005) into `frontend/src/App.tsx`: add `budgetMinutes` state initialized from `getStoredBudgetMinutes(todayKey())` (T004) on mount, render the panel above the recommendation area on the Active view, and call `setStoredBudgetMinutes` (T004) plus update state in the `onBudgetSet` handler (depends on T004, T005)

**Checkpoint**: Setting today's budget works and survives a reload without re-prompting.

---

## Phase 4: User Story 2 - See remaining capacity at a glance (Priority: P1)

**Goal**: The user always sees a simple, accurate remaining-capacity figure, and the recommendation engine never suggests a task that doesn't fit within it.

**Independent Test**: Set a daily budget, complete a task with a known duration, and confirm the displayed remaining capacity decreases by exactly that duration; confirm the recommendation engine never surfaces a task exceeding remaining capacity even when the entered available-time value is larger.

### Implementation for User Story 2

- [ ] T007 [US2] Implement `remainingCapacityMinutes(budgetMinutes, completedTodayMinutes)` in `frontend/src/lib/dailyCapacity.ts`: returns `Math.max(0, budgetMinutes - completedTodayMinutes)`, per FR-008 (depends on T003)
- [ ] T008 [US2] In `frontend/src/App.tsx`, compute `completedTodayMinutes` via `sumDurationMinutes` (T003) over `completedTasks` filtered to `toLocalDateKey(task.completed_at) === todayKey()` (T002), and `remainingMinutes` via `remainingCapacityMinutes` (T007) (depends on T002, T003, T007)
- [ ] T009 [US2] Extend `DailyCapacityPanel.tsx` (T005) to display the remaining-capacity line (e.g., "3 saatten 1 saat 20 dakikan kaldı") whenever a budget is set, receiving `remainingMinutes`/`budgetMinutes` as props (depends on T005, T008)
- [ ] T010 [US2] In `frontend/src/App.tsx`, whenever a budget is set, cap the `minutes` value passed into `pickRecommendation` (`frontend/src/lib/recommendation.ts`, unchanged) to `Math.min(enteredMinutes, remainingMinutes)` before calling it, per research.md R2 / FR-009 (depends on T008)

**Checkpoint**: Remaining capacity is shown accurately and the recommendation engine respects it. Combined with US1, the day's realistic ceiling is both set and tracked live.

---

## Phase 5: User Story 3 - Get a calm nudge, never a block, when over-planning (Priority: P1)

**Goal**: When today's planned work exceeds the budget, a calm advisory appears without blocking anything; it disappears once the plan is back under budget.

**Independent Test**: Set a daily budget, plan enough active work to exceed it, and confirm a calm advisory message appears while all normal task actions remain fully available and unblocked; confirm the message disappears once the plan drops back under budget.

### Implementation for User Story 3

- [ ] T011 [US3] In `frontend/src/App.tsx`, compute `plannedMinutes` via `sumDurationMinutes` (T003) over `activeTasks`, and `isOverPlanned = budgetMinutes !== null && plannedMinutes > budgetMinutes`, re-evaluated on every render so it stays live per FR-006 (depends on T003)
- [ ] T012 [US3] Extend `DailyCapacityPanel.tsx` (T009) to render a calm, non-blocking advisory message (e.g., "bugün için planladığın işler ayırdığın zamanın iki katı — bir kısmını yarına bırakmak ister misin?") when `isOverPlanned` is true (prop from T011), styled consistently with the existing empty-state/advisory text and never disabling any other control in the app, per FR-005 (depends on T009, T011)

**Checkpoint**: Over-planning produces a calm, live-updating nudge that never blocks other actions. US1+US2+US3 together deliver the full realistic-capacity loop.

---

## Phase 6: User Story 4 - Leave each day feeling what got finished (Priority: P1)

**Goal**: A same-day progress summary celebrates completed count and time, with zero reference to unfinished work, including a calm starting state when nothing's been completed yet.

**Independent Test**: Complete one or more tasks in a day and confirm the app shows a positive summary (count completed, time completed) that contains no mention of remaining, overdue, or undone work; confirm a calm, encouraging starting state shows when zero tasks are completed today.

### Implementation for User Story 4

- [ ] T013 [US4] Implement `ProgressPanel.tsx` in `frontend/src/components/`: accepts `completedTasks`, filters to today via `toLocalDateKey`/`todayKey` (T002) and sums via `sumDurationMinutes` (T003) to get today's completed count and minutes, and renders either a celebratory summary (count + time) or a calm zero-state message when the count is zero — with no reference to active/faded/archived tasks anywhere in the component, per FR-010/FR-011/FR-012 (depends on T002, T003)
- [ ] T014 [US4] Wire `ProgressPanel` (T013) into `frontend/src/App.tsx`, rendering it on the Active view alongside `DailyCapacityPanel` (depends on T013)

**Checkpoint**: Completing tasks produces visible, positive same-day feedback with zero mention of unfinished work. US1-US4 together deliver realistic planning plus finish-first feedback within a single day.

---

## Phase 7: User Story 5 - See your finishing momentum build over time (Priority: P2)

**Goal**: A 7-day history view plus a consecutive-day streak, built solely from completed tasks, with zero-completion days shown neutrally.

**Independent Test**: Complete tasks across more than one day (backdating `completed_at` for testing) and confirm a history view shows completed-task activity per day for the last 7 days plus a current streak count, with no reference to unfinished or leftover work on any day shown.

### Implementation for User Story 5

- [ ] T015 [US5] Implement `buildHistory(completedTasks: Task[], days = 7)` in `frontend/src/lib/dailyCapacity.ts`: buckets `completedTasks` by `toLocalDateKey(task.completed_at)` (T002) into an array of `DailyHistoryDay` (T001) covering the most recent `days` local calendar days (today inclusive), including zero-completion days, per FR-013 (depends on T001, T002)
- [ ] T016 [US5] Implement `computeStreak(history: DailyHistoryDay[])` in `frontend/src/lib/dailyCapacity.ts`: walks backward from today (or from yesterday if today's entry has zero completions) counting consecutive days with `completedCount >= 1`, stopping at the first zero-completion day, per FR-014 (depends on T015)
- [ ] T017 [US5] Extend `ProgressPanel.tsx` (T013) to render the last 7 days from `buildHistory` (T015) — zero-completion days shown as a quiet, neutral gap, never negatively framed — and the current streak from `computeStreak` (T016), stated plainly with no blaming language on reset, per FR-013/FR-014 and the streak-reset Edge Case (depends on T013, T015, T016)

**Checkpoint**: All five user stories work together — a realistic daily budget, honest remaining capacity that the recommendation engine respects, a calm over-budget nudge, and a completion-only progress story spanning both today and the last week.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide consistency once all stories are complete.

- [ ] T018 [P] Update `README.md` with a brief note on setting a daily budget and reading the progress panel, per constitution Principle XII (Concise Documentation)
- [ ] T019 Run through every scenario in `specs/004-daily-capacity-progress/quickstart.md` end-to-end (using the `sqlite3` backdating steps for the history scenario) and fix any discrepancies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories.
- **User Stories (Phase 3–7)**: All depend on Foundational (Phase 2) completion.
  - US1 (P1) has no dependency on US2/US3/US4/US5 — it's the MVP slice.
  - US2 (P1) depends on US1's `DailyCapacityPanel` (T005) and budget state (T006) existing to extend.
  - US3 (P1) depends on US2's extended `DailyCapacityPanel` (T009) to extend further.
  - US4 (P1) has no dependency on US1/US2/US3's component — it's an independent panel, only sharing the Foundational primitives (T002/T003).
  - US5 (P2) depends on US4's `ProgressPanel` (T013) to extend.
  - Recommended order: US1 → US2 → US3 → US4 → US5 (matches spec.md priorities); US4 could technically be built in parallel with US2/US3 since it touches a different component file, but is listed after per priority order.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### Within Each User Story

- Pure logic functions in `lib/dailyCapacity.ts` before the component code that calls them.
- `DailyCapacityPanel`/`ProgressPanel` changes before the `App.tsx` wiring that uses them.
- Story complete and checkpoint-verified before moving to the next priority.

### Parallel Opportunities

- Foundational: T002 and T003 can run in parallel (independent functions in the same new file — coordinate to avoid merge conflicts, or run sequentially in one sitting).
- US1: T004 and T005 can run in parallel (different files); T006 depends on both.
- US4: T013 can be developed in parallel with US2/US3 (T007-T012) since it's a separate component file, sharing only the already-complete Foundational primitives.
- Polish: T018 can run in parallel with T019.
- `App.tsx` is touched sequentially across US1/US2/US3/US4 (T006, T008/T010, T011, T014) — true parallelism across those stories is limited for that file, matching the pattern already established in specs 002-003.

---

## Parallel Example: Foundational Phase

```bash
# After T001 (module shell) is done, these can proceed together:
Task: "Implement todayKey() and toLocalDateKey(isoString) in frontend/src/lib/dailyCapacity.ts"
Task: "Implement sumDurationMinutes(tasks) in frontend/src/lib/dailyCapacity.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Enter a daily budget, reload, and confirm it's remembered for the rest of the day
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → local-date and sum primitives ready
2. Add US1 → daily budget entry persists for the day (MVP demo)
3. Add US2 → remaining capacity shown live, recommendation engine respects it
4. Add US3 → calm over-budget nudge, never blocking
5. Add US4 → same-day finish-first progress summary
6. Add US5 → 7-day history + streak
7. Polish → docs + full quickstart pass

---

## Notes

- [P] tasks touch different files (or independent functions with low conflict risk) with no unmet dependencies.
- [Story] labels map every user-story-phase task back to spec.md for traceability.
- No test tasks are included — not requested for this feature (constitution Principle VIII).
- No backend tasks are included — this feature is frontend-only (plan.md Decision: no backend changes, research.md R1).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
