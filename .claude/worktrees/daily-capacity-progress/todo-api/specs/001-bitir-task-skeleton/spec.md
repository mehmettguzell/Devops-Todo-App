# Feature Specification: Bitir — Active Task List Skeleton

**Feature Branch**: `001-bitir-task-skeleton`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "The goal is to build a task management web app called 'Bitir', focused on finishing work rather than hoarding it. Most todo apps are good at capturing tasks but constantly inflate the list; this ever-growing list makes users feel overwhelmed and eventually causes them to abandon the app. The opinion of this app is: a user should not face a list, but the work they can actually do right now, and should feel the momentum that comes from finishing. In this first step we set up only the basic skeleton. There should be a single main page where the user's active tasks are shown as a simple list. Each task should carry its title, its estimated duration, and the energy level it requires (low / medium / high). Next to each task there should be a control to mark it as completed; a completed task should leave the active list and move to a separate 'completed' view. To add a new task, clicking a button should open a modal form (title, estimated duration, and energy level fields). The design should be a calm, spacious, light theme with plenty of whitespace."

## Clarifications

### Session 2026-07-03

- Q: Does the task list persist across sessions/reloads, or is it ephemeral (in-memory only)? → A: Tasks persist server-side and survive page reload/app restart.
- Q: In what order are tasks shown in the active list? → A: Newest task first (most recently added at top).
- Q: What format is estimated duration entered/stored in? → A: A numeric field in minutes (e.g., "30").
- Q: What information does the completed view show for each task? → A: Title, estimated duration, and energy level (same as active list).
- Q: In what order are tasks shown in the completed view? → A: Most recently completed first.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture a task quickly (Priority: P1)

A user has something on their mind that they need to do. They open Bitir, click an "Add task" button, and a modal appears asking for the task's title, how long they expect it to take, and how much energy it will require. They submit the form and the task appears in their active list.

**Why this priority**: Without the ability to capture work, there is nothing to see, complete, or build momentum around. This is the entry point for every other interaction.

**Independent Test**: Can be fully tested by opening the app, clicking "Add task", filling in the modal form, submitting it, and confirming the task now appears in the active task list.

**Acceptance Scenarios**:

1. **Given** the user is on the main page, **When** they click the "Add task" button, **Then** a modal opens with fields for title, estimated duration, and energy level.
2. **Given** the add-task modal is open with valid values entered, **When** the user submits the form, **Then** the modal closes and the new task appears in the active task list showing its title, estimated duration, and energy level.
3. **Given** the add-task modal is open, **When** the user closes it without submitting, **Then** no task is created and the active list is unchanged.

---

### User Story 2 - See only what's actionable right now (Priority: P1)

A user opens Bitir and sees their active tasks as a single, simple list — not a sprawling backlog. Each task clearly shows its title, estimated duration, and required energy level, so the user can immediately judge what they could realistically tackle next.

**Why this priority**: This is the core differentiator of the product — presenting actionable work instead of an overwhelming backlog. It's the value proposition the rest of the app is built around.

**Independent Test**: Can be fully tested by seeding one or more active tasks and confirming the main page renders them as a list with title, estimated duration, and energy level visible for each, in a calm and uncluttered layout.

**Acceptance Scenarios**:

1. **Given** the user has active tasks, **When** they open the main page, **Then** they see each task's title, estimated duration, and energy level in a simple list, ordered newest-first (most recently added task at the top).
2. **Given** the user has no active tasks, **When** they open the main page, **Then** the page communicates that the active list is empty rather than showing a blank or broken layout.

---

### User Story 3 - Finish a task and feel momentum (Priority: P2)

Having completed a piece of work, the user marks the corresponding task as done directly from the active list. The task immediately disappears from the active list, reinforcing the feeling that the list is shrinking and progress is being made.

**Why this priority**: Completing work and feeling the resulting momentum is the emotional payoff the product is designed around, directly supporting the "finish, don't hoard" philosophy. It depends on User Story 1/2 existing but is independently verifiable.

**Independent Test**: Can be fully tested by seeding an active task, triggering its "mark complete" control, and confirming it no longer appears in the active list.

**Acceptance Scenarios**:

1. **Given** a task is in the active list, **When** the user activates its "mark complete" control, **Then** the task is immediately removed from the active list.
2. **Given** a task has just been marked complete, **When** the user navigates to the completed view, **Then** the task appears there.

---

### User Story 4 - Review what's been finished (Priority: P3)

A user wants to look back at what they've accomplished. They navigate to a separate "completed" view and see the list of tasks they've finished, distinct from the active list they focus on day to day.

**Why this priority**: Reinforces the sense of progress and keeps completed work out of the way of the active list, but is not required for the core "capture → focus → finish" loop to function.

**Independent Test**: Can be fully tested by marking one or more tasks complete and confirming they appear in a dedicated completed view, separate from the active list.

**Acceptance Scenarios**:

1. **Given** one or more tasks have been marked complete, **When** the user navigates to the completed view, **Then** they see those tasks listed with their title, estimated duration, and energy level.
2. **Given** no tasks have been completed yet, **When** the user navigates to the completed view, **Then** the page communicates that no tasks have been completed yet.

---

### Edge Cases

- What happens when the user submits the add-task form with an empty title? The system MUST reject the submission and indicate the title is required, keeping the modal open.
- What happens when the user submits the add-task form without selecting an energy level or without an estimated duration? The system MUST reject the submission and indicate which field is missing, keeping the modal open (both fields are required — see Assumptions).
- How does the system handle a user marking the same task complete twice in rapid succession (e.g., double-click)? The second action MUST be a no-op — the task must not error or duplicate.
- How does the system handle an empty active list vs. an empty completed list? Each MUST show a distinct, calm empty state rather than an error or a blank screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a single main page listing the user's active (not-yet-completed) tasks, ordered newest-first (most recently added task at the top).
- **FR-002**: Each task in any list MUST display its title, estimated duration, and energy level (low, medium, or high).
- **FR-003**: System MUST provide an "Add task" button on the main page that opens a modal form when clicked.
- **FR-004**: The add-task modal MUST collect a title, an estimated duration (a whole number of minutes), and an energy level (low, medium, or high) for the new task.
- **FR-005**: System MUST require title, estimated duration, and energy level to be provided before a task can be created, and MUST reject incomplete submissions with a clear indication of what's missing.
- **FR-006**: Upon successful submission of the add-task form, the system MUST add the new task to the active list and close the modal.
- **FR-007**: System MUST provide a control next to each active task that lets the user mark it as completed.
- **FR-008**: When a task is marked completed, the system MUST remove it from the active list immediately.
- **FR-009**: System MUST provide a separate "completed" view showing tasks that have been marked completed, ordered most-recently-completed-first.
- **FR-010**: A completed task MUST NOT appear in the active list, and MUST appear in the completed view.
- **FR-011**: System MUST present the active list, completed view, and add-task modal using a light-themed, spacious visual style with generous whitespace, consistent with a calm, low-clutter design intent.
- **FR-012**: System MUST allow the user to navigate between the active task list and the completed view.
- **FR-013**: System MUST display a distinct empty state on the active list when there are no active tasks, and on the completed view when there are no completed tasks.
- **FR-014**: System MUST persist tasks (and their active/completed status) server-side so that they survive a page reload or application restart.

*Deferred to later iterations (explicitly out of scope for this skeleton):* task editing, task deletion, reordering/prioritization, recommendations based on duration/energy, undo for completion, filtering or search.

### Key Entities

- **Task**: A single unit of work the user wants to do. Attributes: title (short text), estimated duration (a whole number of minutes), energy level (one of low / medium / high), completion status (active or completed). A task starts as active and transitions to completed exactly once (this skeleton does not support reopening a completed task).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can capture a new task (open modal, fill fields, submit) in under 15 seconds.
- **SC-002**: A user can mark a task as complete in a single interaction (one click/tap) and sees it leave the active list instantly (no perceptible delay).
- **SC-003**: On first viewing the main page, a user can correctly identify the title, estimated duration, and energy level of any active task without additional navigation or explanation.
- **SC-004**: 100% of tasks marked completed are retrievable in the completed view and absent from the active list.
- **SC-005**: Users report the main page as visually calm/uncluttered in informal review (qualitative check against the "spacious, light theme" intent) rather than dense or overwhelming.

## Assumptions

- **Target audience**: General audience — individuals managing their own personal/professional tasks. No niche-specific accommodations (e.g., ADHD-specific pacing, freelance billing framing) are built into this skeleton; language, defaults, and UX stay generic.
- **Single-user, no accounts**: This skeleton is single-user with no sign-in, registration, or session management. All tasks belong to "the" user of the running instance. Multi-user support and authentication are out of scope until explicitly requested in a later iteration.
- **Required fields**: Estimated duration and energy level are REQUIRED (not optional) when creating a task. This is a deliberate default: the app's stated purpose is to later generate recommendations from exactly these two fields, so allowing them to be skipped would undermine that roadmap and create tasks the app cannot reason about.
- Estimated duration is captured as a whole number of minutes (see Clarifications).
- Energy level is a fixed 3-point scale: low, medium, high. No custom or numeric scale is introduced in this skeleton.
- A completed task in this skeleton is a one-way transition — there is no "reopen" or "undo" action; that is deferred to a later iteration.
- No task editing or deletion is included in this skeleton; only create and complete.
- No due dates, priorities, tags, categories, or notes are included in this skeleton — only title, estimated duration, and energy level, per the description.
- Visual/interaction design ("calm, spacious, light theme") is treated as a qualitative product requirement for this skeleton; exact colors, spacing scale, and typography are implementation/design decisions for the planning phase, not specified here.
