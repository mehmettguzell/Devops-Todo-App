# Feature Specification: Single-Task Recommendation Engine

**Feature Branch**: `002-single-task-recommendation`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "In this step we add the distinctive heart of the app: the single-task recommendation engine. The goal is to prevent the user from staring at a long list and suffering the 'which one should I do now?' indecision. On the main page, the user should be able to tell the app how much time they currently have and their current energy level — for example 'I have 45 minutes' and 'my energy is medium'. There should be a simple area on the page to enter this; energy level is chosen among low / medium / high, and available time is entered in minutes. When the user enters this information, the app should recommend a SINGLE task from among the active tasks that fits this situation. A suitable task is one that fits within the entered time (its estimated duration is less than or equal to the available time) and whose energy level is compatible with the user's current energy. The app should not show all suitable tasks as a list; it should surface only one, because the purpose of the product is to take the burden of choosing away from the user. The user facing the recommended task should have three options: do the task and mark it complete, say 'not now' and ask for another recommendation, or dismiss the recommendation and return to the normal list. When the user asks for 'another recommendation', the app should recommend a different task matching the same criteria. If no task matches the entered time and energy, the app should communicate this with a calm, non-overwhelming message (for example 'you have nothing suitable right now — maybe it's time for a break') and should not encourage the user to pile up new tasks."

## Clarifications

### Session 2026-07-03

- Q: Should energy matching be an exact match (medium energy → only medium tasks) or a "current energy and below" logic (medium energy → medium and low tasks are suitable)? → A: "Current energy and below" — a task is suitable if its required energy level is less than or equal to the user's entered energy level (low ≤ medium ≤ high). A high-energy task is never suitable when the user reports low or medium energy.
- Q: When multiple tasks are equally suitable, which one should the app recommend? → A: Shortest estimated duration first (quick win), ties broken by oldest-added-first.
- Q: Should a task the user marked "not now" be hidden for a while, or can it reappear in the cycle? → A: Excluded only for the current recommendation cycle; fully eligible again as soon as the user submits new time/energy criteria (no longer-term suppression or cooldown).
- Q: Does the recommendation state (entered time/energy and any shown recommendation) survive a page reload? → A: No — a reload clears everything back to the empty input state; the user must re-enter their time and energy to get a new recommendation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get told what to do right now (Priority: P1)

A user opens Bitir with a batch of active tasks sitting in the list. Instead of scanning the whole list and agonizing over what to tackle, they enter how much time they currently have (in minutes) and how much energy they feel they have (low, medium, or high). The app responds with exactly one recommended task that fits both constraints, so the user can start working immediately without deciding for themselves.

**Why this priority**: This is the core value proposition of the feature and the reason it exists — replacing "which one should I do now?" indecision with a single, confident suggestion. Without this, the feature delivers no value.

**Independent Test**: Can be fully tested by seeding active tasks with a range of durations and energy levels, entering a time and energy value, and confirming exactly one matching task is shown (never zero when a match exists, never more than one).

**Acceptance Scenarios**:

1. **Given** the user has active tasks with varying durations and energy levels, **When** they enter an available time and energy level and request a recommendation, **Then** the app shows exactly one task whose estimated duration is less than or equal to the entered time and whose energy level is compatible with the entered energy.
2. **Given** the recommendation area is showing a recommended task, **When** the user looks at the page, **Then** no other candidate tasks are listed alongside it — only the single recommendation is visible.
3. **Given** multiple active tasks all satisfy the entered time and energy, **When** a recommendation is generated, **Then** the app deterministically picks one task rather than presenting a choice back to the user.

---

### User Story 2 - Act on the recommendation (Priority: P1)

Having received a recommended task, the user decides what to do with it: they can do it now and mark it complete on the spot, say "not now" to get a different suggestion that still fits their stated time and energy, or dismiss the recommendation entirely and return to browsing the normal active list.

**Why this priority**: A recommendation the user cannot act on is a dead end. These three actions are what make the recommendation usable in practice and are as essential as generating the recommendation itself.

**Independent Test**: Can be fully tested by triggering a recommendation and separately exercising each of the three actions (complete, not now, dismiss), confirming the resulting state matches expectations for each.

**Acceptance Scenarios**:

1. **Given** a task is being recommended, **When** the user marks it complete from the recommendation area, **Then** the task moves to the completed view exactly as it would from the active list, and the recommendation area clears or updates accordingly.
2. **Given** a task is being recommended, **When** the user selects "not now", **Then** the app shows a different task that still satisfies the same entered time and energy, if one exists.
3. **Given** the user has said "not now" to every other matching task, **When** they select "not now" again, **Then** the app communicates that no further alternatives are available rather than erroring or repeating a task already declined in this cycle.
4. **Given** a task is being recommended, **When** the user dismisses the recommendation, **Then** the recommendation area closes and the user sees the normal active task list unaffected (the task is not completed, and its status is unchanged).

---

### User Story 3 - Nothing fits right now (Priority: P2)

A user enters their available time and energy, but none of their active tasks fit. Rather than an error or an empty list, the app tells them calmly that nothing suitable is available right now and gently suggests this might be a moment to rest, without prompting them to add more tasks.

**Why this priority**: Handling the "no match" case is what keeps the feature calm and true to the product's philosophy under real-world conditions (an empty or mismatched list is common), but the feature already delivers its core value via User Stories 1-2 before this case is reached.

**Independent Test**: Can be fully tested by seeding active tasks whose durations/energy never satisfy a chosen time/energy combination, requesting a recommendation, and confirming a calm no-match message appears with no task shown and no prompt to add new tasks.

**Acceptance Scenarios**:

1. **Given** no active task fits the entered time and energy, **When** the user requests a recommendation, **Then** the app shows a calm message indicating nothing suitable is available right now, and shows no task.
2. **Given** the no-match message is shown, **When** the user reviews the page, **Then** there is no call-to-action urging them to add a new task.

---

### Edge Cases

- What happens when the user has zero active tasks at all? The system MUST show the same calm "nothing suitable" messaging as the no-match case, not a distinct error.
- What happens when the user enters a time of 0 or a negative number? The system MUST treat this as invalid input and prompt for a valid positive number of minutes rather than silently returning no recommendation.
- What happens when every matching task has been cycled through via "not now" in the current session? The system MUST inform the user that alternatives are exhausted (see User Story 2, Scenario 3) instead of repeating a previously declined task or erroring.
- How does the system handle a task that stops being active (e.g., completed elsewhere) while it is currently displayed as the recommendation? The recommendation MUST be treated as stale and re-evaluated rather than allowing the user to act on a task that is no longer active.
- What happens if the user changes the entered time/energy while a recommendation is already showing? The system MUST generate a fresh recommendation against the new criteria (and reset the "declined in this cycle" history), replacing the old one.
- What happens if the user reloads the page while a recommendation is showing? The system MUST clear the input and recommendation entirely (see Clarifications); the user starts over by re-entering time and energy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an input area on the main page where the user enters their currently available time in whole minutes and selects a current energy level (low, medium, or high).
- **FR-002**: System MUST reject a time entry that is zero, negative, or not a whole number, and prompt the user to correct it before generating a recommendation.
- **FR-003**: Upon valid submission of time and energy, the system MUST evaluate the user's active tasks and determine the set of suitable tasks: a task is suitable only if its estimated duration is less than or equal to the entered available time, AND its energy level is less than or equal to the entered energy level (low ≤ medium ≤ high; see Clarifications).
- **FR-004**: When one or more suitable tasks exist, the system MUST present exactly one of them as "the recommendation" and MUST NOT display the other suitable tasks alongside it.
- **FR-005**: When multiple suitable tasks exist, the system MUST select the recommended task deterministically by preferring the shortest estimated duration first; if multiple suitable tasks share the shortest duration, the system MUST prefer the one that was added earliest (oldest first).
- **FR-006**: The recommendation area MUST offer the user exactly three actions on the current recommendation: mark it complete, request another recommendation ("not now"), and dismiss the recommendation.
- **FR-007**: When the user marks the recommended task complete, the system MUST apply the same completion behavior as completing a task from the active list (task leaves the active list and appears in the completed view).
- **FR-008**: When the user requests another recommendation ("not now") for the current task, the system MUST select a different suitable task matching the same entered time and energy, excluding tasks already declined via "not now" earlier in the same recommendation cycle.
- **FR-009**: When the user has declined (via "not now") every suitable task matching the current entered time and energy, the system MUST inform the user that no further alternatives remain, distinct from the "no suitable task at all" message.
- **FR-010**: When the user dismisses the recommendation, the system MUST close the recommendation area, leave the declined task's status unchanged, and return the user to the normal active task list.
- **FR-011**: When no active task is suitable for the entered time and energy (including when there are no active tasks at all), the system MUST display a calm message indicating nothing suitable is available right now, and MUST NOT display any task or a prompt to create a new task.
- **FR-012**: The set of tasks excluded via "not now" (the current recommendation cycle) MUST reset whenever the user submits a new time/energy entry, so previously declined tasks become eligible again under new criteria.
- **FR-013**: If the currently recommended task is completed or otherwise becomes inactive through another part of the app while still displayed, the system MUST NOT allow further action on it as if it were still active; it MUST re-evaluate and show an up-to-date recommendation or the no-match message.
- **FR-014**: A page reload MUST clear the entered time/energy input and any currently shown recommendation entirely, returning the user to the empty input state; recommendation state is not restored after a reload.

### Key Entities

- **Recommendation Request**: The user's stated situation at a point in time — available time (whole minutes) and current energy level (low/medium/high). Not persisted; used only to compute the current recommendation.
- **Recommendation Cycle**: The set of tasks already shown and declined ("not now") since the last time the user submitted a time/energy entry. Reset whenever new criteria are submitted or the recommendation is dismissed.
- **Task** (existing entity, reused): Suitability for recommendation is derived from its existing estimated duration and energy level attributes; no new attributes are added to Task by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from opening the app to seeing a single actionable recommendation in under 10 seconds (enter time, enter energy, receive recommendation).
- **SC-002**: 100% of recommendations shown satisfy both the entered time and energy constraints — no recommendation ever exceeds the stated available time or exceeds the stated energy level.
- **SC-003**: At no point does the recommendation area display more than one task at a time.
- **SC-004**: A user can complete, decline ("not now"), or dismiss a recommendation in a single interaction (one click/tap) per action.
- **SC-005**: When no task fits, 100% of users see a calm explanatory message instead of an empty, broken, or error state, and are never prompted to add new tasks from that state.

## Assumptions

- **Energy compatibility direction**: A task is suitable when its required energy is at or below the user's stated energy (low ≤ medium ≤ high); see Clarifications. A high-energy task is never suggested to a user reporting low or medium energy.
- **Tie-breaking for recommendation order**: When multiple tasks are equally suitable, the shortest estimated duration is preferred (favors quick wins and momentum), with ties broken by oldest-added-first. No randomization is introduced (confirmed; see Clarifications).
- **Scope of "not now" exclusion**: A task declined via "not now" is excluded only for the remainder of the current recommendation cycle (until the user submits new time/energy criteria or dismisses the recommendation). It is not hidden long-term and remains a normal active task, fully eligible again in any future recommendation cycle (confirmed; see Clarifications).
- **No persistence of recommendation state**: The entered time/energy and the in-progress recommendation cycle are treated as transient UI state, not persisted server-side or client-side; reloading the page clears them entirely, returning the user to the empty input state (confirmed; see Clarifications).
- **Single recommendation input, not per-task filtering**: This feature does not add a way to browse/filter the full active list by time or energy; the only interface to this logic is the single-task recommendation flow described here.
- **No changes to task creation**: This feature does not alter how tasks are created, edited, or their required fields (duration, energy) established in the prior iteration.
