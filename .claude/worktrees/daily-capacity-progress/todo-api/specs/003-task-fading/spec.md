# Feature Specification: Task Fading & Archival

**Feature Branch**: `003-task-fading`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Bu adımda uygulamayı diğer todo uygulamalarından ayıran ikinci temel özelliği ekliyoruz: görev solması. Çoğu uygulama hiçbir görevi asla kaybetmemeye çalışır, bu yüzden liste sonsuza kadar büyür. Bu uygulamanın görüşü ise tersidir: bir göreve uzun süre dokunulmuyorsa, muhtemelen gerçekten önemli değildir ve listeyi tıkamamalıdır. Bir görev belirli bir süre boyunca hiç dokunulmadan (tamamlanmadan, düzenlenmeden veya bir öneride kabul edilmeden) kalırsa, uygulama o görevi önce 'solmuş' duruma geçirmeli. Solmuş görevler aktif listede kalmalı ama görsel olarak soluk/silik görünmeli, böylece kullanıcı onların ihmal edildiğini fark etsin. Solmuş bir görev aktif listede ve öneri motorunda normal görevlerin gerisinde kalmalı. Bir görev solmuş durumdayken de dokunulmadan daha uzun süre kalırsa, uygulama onu otomatik olarak arşive taşımalı. Arşivlenmiş görevler ana listede görünmemeli ve öneri motoruna dahil olmamalı, ancak ayrı bir arşiv görünümünden erişilebilmeli. Kullanıcı, solmuş veya arşivlenmiş bir görevi tek bir işlemle geri canlandırabilmeli; canlandırılan görev, dokunulma zamanı sıfırlanmış şekilde tekrar aktif ve taze duruma dönmeli. Kullanıcı ayrıca bir görevi hiç solmaması gerektiğini işaretleyebilmeli (örneğin gerçekten önemli ama uzun vadeli bir iş), böylece o görev solma davranışının dışında tutulmalı. Solma sürecinin amacı kullanıcıyı utandırmak değil, listeyi doğal olarak temiz tutmaktır; bu yüzden görevler sessizce solmalı, suçlayıcı uyarılar gösterilmemeli."

## Clarifications

### Session 2026-07-13

- Q: Solma ve arşivleme süreleri ne olmalı ve kullanıcı bu süreleri değiştirebilmeli mi? → A: Kullanıcı ayarlanabilir — varsayılan olarak 7 gün sonra sol, 21 gün sonra arşivle; kullanıcı bu iki süreyi bir ayarlar alanından değiştirebilir.
- Q: Son tarihi olan görevler de solmalı mı? → A: Bu özellik kapsamına "son tarih" (due date) kavramı dahil edilir; son tarihi olan bir görev, o son tarih geçmediği sürece solma/arşivleme davranışının tamamen dışında tutulur (otomatik muafiyet).
- Q: Solma zamanlaması tam olarak neyi "dokunma" sayar? → A: Sadece kesin eylemler sayaç sıfırlar: oluşturma, düzenleme, tamamlama, canlandırma. Bir görevin sadece görüntülenmesi veya öneri motoru tarafından sunulması (kabul edilmeden) sayaç sıfırlamaz.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See neglect without being nagged (Priority: P1)

A user has been actively using Bitir for weeks. Some tasks get done quickly; others sit untouched because they weren't actually important. Without the user doing anything, those neglected tasks visually fade in the active list — still there, still clickable, but visibly less prominent than fresh tasks — so the user can tell at a glance which items have gone stale, with no popup, badge, or warning telling them they're behind.

**Why this priority**: This is the perceptual core of the feature — the "quiet, non-shaming" signal that stale tasks are stale. Without it, nothing distinguishes this feature from a plain todo list, and the fading value proposition doesn't exist.

**Independent Test**: Seed one freshly-created active task and one active task whose last-touched time is older than the fade threshold; load the active list and confirm the stale task renders with a visually faded/muted treatment while the fresh task renders normally, with no dialog, toast, or badge appearing.

**Acceptance Scenarios**:

1. **Given** an active task has not been touched for at least the fade threshold, **When** the user views the active list, **Then** that task is visually rendered as faded (muted styling) while still appearing in the list.
2. **Given** a mix of fresh and faded active tasks, **When** the user views the active list, **Then** faded tasks are ordered after fresh tasks rather than interleaved by creation date alone.
3. **Given** a faded task, **When** the recommendation engine evaluates candidates, **Then** the faded task is only recommended after all equally-suitable fresh tasks have been offered.
4. **Given** a task has just faded, **When** the transition happens, **Then** no notification, warning, or interruptive message is shown to the user.

---

### User Story 2 - Old, forgotten work quietly leaves the list (Priority: P1)

A task has been faded for a while and still nobody has touched it. Rather than sitting there forever as visual clutter, the app moves it out of the way entirely into an archive. The active list — and the single-task recommendation — never has to deal with it again unless the user goes looking for it.

**Why this priority**: This is what actually keeps the active list from growing forever — the stated purpose of the whole feature. Fading alone (US1) signals neglect but doesn't solve list bloat; archival is what closes the loop.

**Independent Test**: Seed a faded task whose last-touched time is older than the archive threshold; run the app's fade/archive evaluation and confirm the task no longer appears in the active list or in any recommendation, but does appear in a separate archive view.

**Acceptance Scenarios**:

1. **Given** a faded task has not been touched for at least the archive threshold, **When** the evaluation runs, **Then** the task is moved to archived status automatically, without requiring user action.
2. **Given** an archived task, **When** the user views the active list, **Then** the archived task does not appear.
3. **Given** an archived task, **When** the recommendation engine evaluates candidates, **Then** the archived task is never suggested.
4. **Given** an archived task, **When** the user opens the archive view, **Then** the task appears there with its title, duration, and energy level visible.

---

### User Story 3 - Bring a task back to life (Priority: P1)

The user spots a faded task they actually still care about, or browses the archive and finds something worth doing after all. In one action, they revive it: it returns to the active list looking exactly like a brand-new task, with its neglect clock reset to zero.

**Why this priority**: Without a low-friction way back, fading and archival would feel punitive and destructive rather than a gentle default — this is what keeps the feature aligned with "not shaming the user" and makes the first two stories safe to ship.

**Independent Test**: Seed one faded task and one archived task; trigger the "revive" action on each; confirm both become active, both render as fresh (not faded), and both are immediately eligible for recommendation again.

**Acceptance Scenarios**:

1. **Given** a faded active task, **When** the user triggers its revive action, **Then** the task's last-touched time resets to now and it immediately renders as fresh, not faded.
2. **Given** an archived task, **When** the user triggers its revive action from the archive view, **Then** the task moves back to the active list, renders as fresh, and disappears from the archive view.
3. **Given** a just-revived task, **When** the recommendation engine next evaluates candidates, **Then** the revived task is treated identically to any other fresh active task (no lingering penalty).

---

### User Story 4 - Protect tasks that are important but slow-moving (Priority: P2)

Some tasks are genuinely important but, by nature, won't be touched for a long stretch — a long-term goal, something waiting on an external event. The user marks such a task as exempt from fading, so it stays visually fresh and fully eligible for recommendation indefinitely, regardless of how long it sits untouched.

**Why this priority**: This prevents the feature's core mechanism from misfiring on legitimate long-horizon work, which would erode trust in the product. It's a safety valve rather than the main value driver, so it can ship slightly after the core loop (US1–US3) is solid.

**Independent Test**: Mark a task as exempt from fading, then advance time past both the fade and archive thresholds; confirm the task still renders as fresh in the active list and remains normally eligible for recommendation, never fading or archiving.

**Acceptance Scenarios**:

1. **Given** a task is marked exempt from fading, **When** it goes untouched past the fade threshold, **Then** it continues to render as fresh, not faded.
2. **Given** a task is marked exempt from fading, **When** it goes untouched past the archive threshold, **Then** it is not moved to the archive.
3. **Given** a task is marked exempt from fading, **When** the user later removes the exemption, **Then** the task becomes subject to fading/archival again, timed from that point forward.

---

### User Story 5 - Give a task a due date so it stays put automatically (Priority: P2)

A user has a task that genuinely needs to wait — it's tied to a future date and touching it sooner wouldn't make sense — but they don't want to bother with the manual "exempt from fading" toggle for it. They give the task a due date instead. As long as that due date hasn't passed, the task is automatically protected from fading and archival, the same way a manually-exempted task would be, without any extra step.

**Why this priority**: This gives the user a natural, purpose-built way to protect date-bound work without overloading the manual exemption toggle (User Story 4), which is meant for open-ended important work rather than dated work. It ships alongside the other protective mechanism (P2) rather than in the initial core loop.

**Independent Test**: Create a task with a due date in the future, advance time past both the fade and archive thresholds, and confirm the task still renders as fresh and remains eligible for recommendation. Then set its due date to a past date and confirm it becomes subject to normal fading/archival timing from that point.

**Acceptance Scenarios**:

1. **Given** a task has a due date that has not yet passed, **When** it goes untouched past the fade or archive threshold, **Then** it is not faded or archived.
2. **Given** a task's due date passes without the task being touched, **When** the next fade/archive evaluation runs, **Then** the task's untouched-time clock is considered to start from the due date, and it becomes subject to normal fading/archival from that point forward.
3. **Given** a task has both a due date in the future and a manual fading exemption, **When** either protection would apply, **Then** the task remains fresh (the two protections are not mutually exclusive).

---

### User Story 6 - Tune the pace of fading (Priority: P3)

A user finds the default pace of fading and archival too fast or too slow for how they work. They open a settings area and adjust how many days of neglect it takes for a task to fade, and how many additional days it takes to archive. The new pace applies going forward to all non-exempt tasks.

**Why this priority**: The default pace (7 days to fade, 21 days to archive) is a reasonable starting point for most users, so this is a refinement rather than something required for the feature to deliver its core value — it can follow after US1–US5 are solid.

**Independent Test**: Open settings, change the fade threshold and archive threshold to different values, save, and confirm a task's fade/archive timing on subsequent evaluations reflects the new thresholds rather than the defaults.

**Acceptance Scenarios**:

1. **Given** the user has not changed any settings, **When** a task's fade/archive timing is evaluated, **Then** the default thresholds (7 days to fade, 21 days to archive) apply.
2. **Given** the user opens the settings area, **When** they view the fading settings, **Then** they see the current fade threshold and archive threshold in days, editable.
3. **Given** the user sets a new fade threshold and a new archive threshold, **When** they save, **Then** all future fade/archive evaluations use the new values.
4. **Given** the user attempts to set an archive threshold that is less than or equal to the fade threshold, **When** they save, **Then** the system rejects the change with a clear message rather than accepting an invalid configuration.

---

### Edge Cases

- What happens to a task's neglect clock when it is marked exempt and later un-marked? The clock MUST restart from the moment the exemption is removed, not resume from whatever elapsed time existed before the exemption was set.
- What happens when a task is completed while already faded? It MUST simply complete as normal (move to the completed view) — fading has no effect on completion behavior.
- What happens when a task is completed while already archived? Completion is not applicable to archived tasks from the active-list flow; the user must revive it first (User Story 3) before it can be completed.
- What happens when the active list is empty except for faded tasks? The list MUST still render those faded tasks (fading never hides a task from the active list — only archival does).
- What happens when every remaining suitable task for a recommendation request is faded? The recommendation engine MUST still recommend the best-fitting faded task rather than showing "nothing suitable," since a faded task is still active and actionable.
- What happens if the user marks an already-faded or already-archived task as exempt? It MUST immediately return to a fresh, active, non-faded state (equivalent to reviving it), since "exempt" and "neglected" are contradictory states.
- What happens if the user gives an already-faded or already-archived task a future due date? It MUST immediately return to a fresh, active, non-faded state, the same as manual exemption, since a future due date is a protection from neglect classification.
- What happens if the user lowers the fade or archive threshold such that some currently-fresh tasks would now qualify as faded or archived under the new values? The next evaluation MUST apply the new thresholds retroactively to existing tasks' last-touched times (not just to newly-created tasks).
- What happens when merely viewing a task (opening it, scrolling past it, or having it appear in a recommendation without being acted on) occurs? None of these count as a "touch" and MUST NOT reset the neglect clock (see Clarifications).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST track, for every active task, the time it was last "touched," where a touch is exactly one of: creation, an edit, being marked complete, or being explicitly revived. Viewing a task or having it surfaced by the recommendation engine without further action MUST NOT count as a touch.
- **FR-002**: System MUST automatically transition an active task to a "faded" state once it has gone untouched for at least the configured fade threshold, without any user action.
- **FR-003**: System MUST visually render faded tasks with a distinguishably muted/faded treatment wherever they appear in the active list, while keeping all normal interactions (view, complete, edit, revive) available on them.
- **FR-004**: System MUST order faded tasks after all non-faded active tasks in the active list, rather than interleaving strictly by creation or touch date.
- **FR-005**: The recommendation engine MUST treat faded tasks as lower priority than non-faded tasks that are otherwise equally suitable, offering faded tasks only once no suitable non-faded task remains for the current recommendation cycle.
- **FR-006**: System MUST automatically transition a faded task to an "archived" state once it has gone untouched for at least the configured archive threshold (measured from the same last-touched time as fading), without any user action.
- **FR-007**: Archived tasks MUST NOT appear in the active list and MUST NOT be eligible for recommendation.
- **FR-008**: System MUST provide a separate archive view listing all archived tasks, showing each task's title, estimated duration, and energy level.
- **FR-009**: System MUST allow the user to revive a faded or archived task in a single action; reviving MUST reset its last-touched time to the moment of revival and return it to a normal active, non-faded state.
- **FR-010**: System MUST allow the user to mark any active task as exempt from fading; while exempt, the task MUST NOT fade or archive regardless of elapsed untouched time, and MUST render as normal (not faded).
- **FR-011**: System MUST allow the user to remove the fading exemption from a task, after which its untouched-time clock restarts from that moment for future fade/archive evaluation.
- **FR-012**: The transition to faded or archived state MUST NOT produce any interruptive notification, warning, badge-count, or shaming message; it is a silent, passive state change discoverable only by looking at the list.
- **FR-013**: If a task marked exempt is later found to already be past the fade/archive thresholds when the exemption is removed, its untouched-time clock MUST restart from the removal moment (not resume counting from before the exemption).
- **FR-014**: System MUST allow the user to set an optional due date on a task. While a task's due date is present and has not yet passed, the task MUST be automatically protected from fading and archival, independent of and in addition to the manual exemption flag (FR-010).
- **FR-015**: Once a task's due date passes without the task being touched, the task's untouched-time clock for fading/archival purposes MUST be considered to start from the due date, and the task becomes subject to normal fade/archive evaluation from that point forward.
- **FR-016**: System MUST allow the user to configure the fade threshold and archive threshold, each expressed in whole days, via a settings area. Defaults are 7 days (fade) and 21 days (archive) when the user has not changed them.
- **FR-017**: System MUST reject a configured archive threshold that is less than or equal to the configured fade threshold, prompting the user to correct it, so that archival can never occur before or simultaneously with fading.
- **FR-018**: A change to the fade or archive threshold MUST apply to all existing non-exempt, non-due-dated tasks on the next evaluation (based on their existing last-touched time), not only to tasks created after the change.

### Key Entities

- **Task** (existing entity, extended): Gains a last-touched timestamp (distinct from creation time), a lifecycle state expansion (`active` → adds `faded` and `archived` as sub-states or additional statuses), a boolean fading-exemption flag, and an optional due date.
- **Fading Settings**: A single set of user-configurable values — the fade threshold and archive threshold, both in whole days — that governs fade/archive timing for all non-exempt, non-due-dated tasks. Defaults to 7 and 21 days respectively until the user changes them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A task that has gone untouched past the fade threshold is visually distinguishable as faded within one page load, with no manual refresh or user action required to trigger the state change.
- **SC-002**: A task that has gone untouched past the archive threshold no longer appears in the active list or in any recommendation, verified across 100% of such tasks.
- **SC-003**: A user can revive any faded or archived task back to a fresh active state in a single interaction (one click/tap).
- **SC-004**: Zero interruptive notifications, warnings, or shaming messages are shown at the moment a task fades or archives, in 100% of observed transitions.
- **SC-005**: A task marked exempt from fading, or holding a future due date, remains fresh and recommendable indefinitely under that protection; across arbitrarily long untouched periods, it never fades or archives while the protection is active.
- **SC-006**: A user can change the fade and archive thresholds and see the new pace reflected in fade/archive behavior without needing any technical assistance.

## Assumptions

- **Thresholds apply uniformly**: A single global fade threshold and a single global archive threshold (each user-configurable, see FR-016) apply to all non-exempt, non-due-dated tasks equally — no per-task or per-category custom thresholds.
- **Fading is purely visual + ordering, not a hidden state**: A faded task remains a normal active task from a data/completion standpoint — it can still be completed, edited, or recommended; only its visual treatment and priority ordering change.
- **Archive view is read-only aside from revival**: The archive view's only interactive action on a task is "revive"; editing or completing directly from the archive view is out of scope (the user must revive first).
- **Revival fully resets neglect state**: There is no partial-credit or decayed penalty after revival — a revived task is indistinguishable from a brand-new task in terms of fade/archive timing and recommendation priority.
- **Exemption is a manual, per-task toggle**: There is no bulk-exempt action or category-level exemption; the user marks tasks exempt one at a time.
- **Due date has no independent reminder/notification behavior**: This feature only uses the due date as a fading/archival protection signal; due-date reminders, overdue badges, or sorting by due date are out of scope unless explicitly requested later.
- **Settings area is minimal**: The fading-settings surface introduced by User Story 6 holds only the two threshold values — it is not a general-purpose settings page for other future preferences.
