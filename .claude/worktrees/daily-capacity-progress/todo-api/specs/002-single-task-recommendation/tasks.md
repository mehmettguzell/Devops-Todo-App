---

description: "Task list for feature implementation"
---

# Tasks: Single-Task Recommendation Engine

**Input**: Design documents from `/specs/002-single-task-recommendation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not included — no tests were explicitly requested for this feature (constitution Principle VIII).

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to repository root. This feature is frontend-only per plan.md — `backend/` is untouched.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the new recommendation module per plan.md. No new dependencies or scaffolding beyond this file — the existing frontend project (001) already provides everything else.

- [X] T001 Create `frontend/src/lib/recommendation.ts` with an ordered `ENERGY_LEVELS` constant (`["low", "medium", "high"]`) and an exported `RecommendationRequest` type (`{ minutes: number; energy: EnergyLevel }`) per data-model.md

**Checkpoint**: The recommendation module exists as an empty shell ready for logic.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure selection logic and shared input form every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Implement `isSuitable(task, request)` in `frontend/src/lib/recommendation.ts`: returns true only if `task.estimated_duration_minutes <= request.minutes` AND the task's energy index is `<=` the request's energy index in `ENERGY_LEVELS` (T001), per FR-003 and the confirmed Clarification ("current energy and below")
- [X] T003 Implement `pickRecommendation(tasks, request, excludedIds)` in `frontend/src/lib/recommendation.ts`: filters active tasks via `isSuitable` (T002), excludes any id in `excludedIds`, and returns the remaining task with the smallest `estimated_duration_minutes` (ties broken by earliest `created_at`), or `undefined` if none remain, per FR-005/FR-008 (depends on T002)
- [X] T004 [P] Implement `RecommendationPanel.tsx` in `frontend/src/components/RecommendationPanel.tsx`: a form with a whole-minutes number field and a low/medium/high energy selector, rejecting zero/negative/non-integer minutes with an inline message before calling its `onSubmit` prop, per FR-001/FR-002

**Checkpoint**: Recommendation selection logic and the input form exist independently and are ready for story wiring.

---

## Phase 3: User Story 1 - Get told what to do right now (Priority: P1) 🎯 MVP

**Goal**: Entering available time and energy surfaces exactly one suitable active task, chosen deterministically (shortest duration first, oldest-added tiebreak).

**Independent Test**: Seed active tasks with varying durations/energy levels, submit a time/energy combination via `RecommendationPanel`, and confirm exactly one correctly-matching task is displayed — never zero when a match exists, never more than one, and the shortest-duration match is preferred when several fit.

### Implementation for User Story 1

- [X] T005 [P] [US1] Implement `RecommendationCard.tsx` in `frontend/src/components/RecommendationCard.tsx`: displays a single task's title, estimated duration, and energy level (display only — no action buttons yet)
- [X] T006 [US1] In `frontend/src/App.tsx`, add recommendation state (current request, current recommended task id) wired to `RecommendationPanel`'s (T004) submit handler: on submit, call `pickRecommendation` (T003) against `activeTasks` with an empty excluded set, and render `RecommendationCard` (T005) for the result in place of the input form, showing exactly one task and no other candidates, per FR-004 (depends on T003, T004, T005)

**Checkpoint**: Entering time/energy shows exactly one matching, correctly-selected task. This is independently testable and demoable.

---

## Phase 4: User Story 2 - Act on the recommendation (Priority: P1)

**Goal**: The user can complete, decline ("not now"), or dismiss the currently recommended task, each with the correct resulting state.

**Independent Test**: With a recommendation showing, exercise each of the three actions in turn (on separate cycles) and confirm: completing moves the task to the completed view; "not now" shows a different matching task or an "alternatives exhausted" message; dismiss returns to the input area with the task's status unchanged.

### Implementation for User Story 2

- [X] T007 [US2] Add "Complete", "Not now", and "Dismiss" buttons to `RecommendationCard.tsx` (T005), each invoking a corresponding callback prop (depends on T005)
- [X] T008 [US2] In `frontend/src/App.tsx`, implement the "Complete" handler: call the existing `completeTask` (`frontend/src/api/tasks.ts`), move the task from active to completed state exactly as the existing active-list completion flow does, and clear the recommendation cycle, per FR-007 (depends on T006, T007)
- [X] T009 [US2] In `frontend/src/App.tsx`, implement the "Not now" handler: add the current task's id to a `declinedTaskIds` set for the active cycle, call `pickRecommendation` (T003) again excluding it, and — when no candidate remains while the original suitable set was non-empty — show an "alternatives exhausted" message distinct from the no-match message, per FR-008/FR-009 (depends on T006, T007)
- [X] T010 [US2] In `frontend/src/App.tsx`, implement the "Dismiss" handler: clear the recommendation state and `declinedTaskIds` entirely and return to the `RecommendationPanel` input area, leaving the declined task's status unchanged, per FR-010 (depends on T006, T007)
- [X] T011 [US2] In `frontend/src/App.tsx`, guard against a stale recommendation: before any action is applied, verify the recommended task is still present in `activeTasks`; if it is not (e.g., completed elsewhere), re-evaluate via `pickRecommendation` (T003) instead of acting on it, per FR-013 (depends on T006)

**Checkpoint**: All three recommendation actions work correctly, including the "alternatives exhausted" edge case. Combined with US1, the recommendation flow is fully usable end-to-end.

---

## Phase 5: User Story 3 - Nothing fits right now (Priority: P2)

**Goal**: When no active task matches the entered time and energy, the user sees a calm message instead of an error, empty area, or prompt to add tasks.

**Independent Test**: Seed active tasks whose durations/energy never satisfy a chosen time/energy combination, submit that combination, and confirm a calm "nothing suitable" message appears with no task shown and no call-to-action to create a new task.

### Implementation for User Story 3

- [X] T012 [US3] In `frontend/src/App.tsx`, render the existing `EmptyState` component (`frontend/src/components/EmptyState.tsx`) with a calm "nothing suitable right now" message and no add-task call-to-action when `pickRecommendation` (T003) returns `undefined` because the suitable set itself is empty — distinct wording from the US2 (T009) "alternatives exhausted" message, per FR-011 (depends on T006)

**Checkpoint**: All three user stories work together — get a recommendation, act on it, and get a calm message when nothing fits.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide consistency once all stories are complete.

- [X] T013 [P] Update `README.md` with a brief note on using the recommendation area, if not already self-evident from existing docs, per constitution Principle XII (Concise Documentation)
- [X] T014 Run through every scenario in `specs/002-single-task-recommendation/quickstart.md` end-to-end and fix any discrepancies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational (Phase 2) completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) depends on US1's recommendation display (T005/T006) existing to have something to act on.
  - US3 (P2) depends on US1's recommendation wiring (T006) to hook into the no-match branch.
  - Recommended order: US1 → US2 → US3 (matches spec.md priorities).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- Selection logic (`lib/recommendation.ts`) before any component wires it in.
- Shared components (`RecommendationPanel`, `RecommendationCard`) before the `App.tsx` wiring that uses them.
- Story complete and checkpoint-verified before moving to the next priority.

### Parallel Opportunities

- Foundational: T004 can run in parallel with T002/T003 (different file, no shared dependency).
- US1: T005 can run in parallel with T002/T003 (different file); T006 depends on all three.
- US2: T007 must precede T008/T009/T010 (same file, `RecommendationCard.tsx`, sequential); T008, T009, T010 all touch `App.tsx` and should be done sequentially to avoid merge conflicts within the same task session.
- Different user stories should still be implemented in priority order since US2/US3 build on US1's wiring in `App.tsx` — true team-parallelism across stories is limited in this feature.

---

## Parallel Example: Foundational Phase

```bash
# These can proceed together:
Task: "Implement isSuitable(task, request) in frontend/src/lib/recommendation.ts"
Task: "Implement RecommendationPanel.tsx in frontend/src/components/RecommendationPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Enter time/energy and confirm a single, correctly-selected task appears
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → selection logic and input form ready
2. Add US1 → a recommendation appears (MVP demo)
3. Add US2 → complete/not-now/dismiss all work
4. Add US3 → calm no-match message
5. Polish → docs + full quickstart pass

---

## Notes

- [P] tasks touch different files with no unmet dependencies.
- [Story] labels map every user-story-phase task back to spec.md for traceability.
- No test tasks are included — not requested for this feature (constitution Principle VIII).
- No backend tasks are included — this feature is frontend-only (plan.md Decision: No new backend endpoint).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
