# Feature Specification: Daily Capacity & Finishing Progress

**Feature Branch**: `004-daily-capacity-progress`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Bu adımda uygulamanın felsefesini tamamlayan son parçayı ekliyoruz: gerçekçi günlük kapasite ve bitirmeyi öne çıkaran ilerleme geri bildirimi. Amaç, kullanıcının güne 15 iş planlayıp 3'ünü yaparak her akşam moralinin bozulmasını önlemek ve onun yerine bitirdiği işlerin verdiği ivmeyi hissettirmek. Kullanıcı gününe başlarken, o gün için kendine gerçekçi bir zaman bütçesi belirleyebilmeli — örneğin 'bugün işlere ayırabileceğim süre 3 saat' gibi. Uygulama, o gün için seçilen/planlanan görevlerin tahmini sürelerini toplayıp bu bütçeyle karşılaştırmalı. Planlanan işlerin toplam süresi günlük bütçeyi aşarsa, uygulama kullanıcıyı sakin bir şekilde uyarmalı ama kullanıcıyı zorlamamalı; karar kullanıcının olmalı. Uygulama, o günkü kalan kapasiteyi her zaman sade bir şekilde gösterebilmeli. Bu gösterim, kalan zamana göre öneri motorunun da farkında olmasını sağlamalı — yani öneri motoru, günün kalan kapasitesine sığmayan bir görevi öne çıkarmamalı. Kullanıcı bir görevi tamamladığında ve gün sonunda, uygulama ilerlemeyi bitirilen işler üzerinden kutlayan bir geri bildirim sunmalı — o gün kaç iş bitirildiği ve ne kadar zamanlık iş tamamlandığı gibi. Bu geri bildirim asla biriken veya yapılmayan işleri vurgulamamalı, saymamalı veya kullanıcıyı bunlar için suçlamamalı. Zaman içinde, uygulama kullanıcının bitirdiği işlerin bir kaydını tutmalı ve bunu teşvik edici, ilerleme hissi veren sade bir biçimde gösterebilmeli."

## Clarifications

### Session 2026-07-13

- Q: Günlük zaman bütçesi her gün sıfırdan mı giriliyor, yoksa ayarlanabilir bir varsayılan mı var? → A: Her gün manuel giriş — varsayılan yok, öneri motorunun mevcut ad-hoc "şu an ne kadar zamanım var" deseniyle aynı; yeni bir Ayarlar yüzeyi gerekmiyor.
- Q: "Bugünün planlanan işleri" (bütçeyle karşılaştırılan toplam) neyi kapsamalı? → A: Tüm aktif görevler (faded dahil) otomatik olarak "bugünün planı" sayılır — kullanıcının görevleri tek tek "bugün için" işaretlemesi gerekmez.
- Q: İlerleme geçmişi görünümü kaç gün geriye gitmeli ve bir seri (streak) mantığı içermeli mi? → A: Son 7 gün, artı ardışık gün serisi (streak) sayısı — en az bir tamamlama olan ardışık günlerin sayısı da gösterilir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set a realistic budget for today (Priority: P1)

At the start of their day, a user tells Bitir how much time they can realistically give to tasks today — for example, "3 hours." This becomes today's capacity, the honest ceiling the rest of the day's guidance is measured against, replacing the instinct to silently pile up more than can actually get done.

**Why this priority**: Every other part of this feature (the calm over-budget nudge, the remaining-capacity display, the recommendation engine's awareness) depends on a budget existing to compare against. Without it, there's nothing to measure realism against.

**Independent Test**: Open the app, enter a daily time budget (e.g., 3 hours), and confirm the app records and displays it as today's capacity.

**Acceptance Scenarios**:

1. **Given** the user has not yet set a budget for today, **When** they open the app, **Then** they are presented with a simple way to enter today's available time.
2. **Given** the user enters a daily time budget, **When** they confirm it, **Then** the app treats that value as today's capacity for the rest of the day's guidance.
3. **Given** the user already set a budget for today, **When** they revisit the app later the same day, **Then** their previously entered budget is still in effect (not asked for again).

---

### User Story 2 - See remaining capacity at a glance (Priority: P1)

Throughout the day, the user can see — in one simple line — how much of today's budget is left, based on what they've already finished. As they complete work, this number shrinks in a way that reflects real progress, not a shrinking to-do list.

**Why this priority**: This is the moment-to-moment feedback that keeps the day's plan honest; without it, the budget from User Story 1 is a one-time number nobody looks at again.

**Independent Test**: Set a daily budget, complete a task with a known duration, and confirm the displayed remaining capacity decreases by exactly that duration.

**Acceptance Scenarios**:

1. **Given** a daily budget is set and no tasks have been completed today, **When** the user views the app, **Then** the remaining capacity shown equals the full budget.
2. **Given** a daily budget is set, **When** the user completes a task, **Then** the displayed remaining capacity decreases by that task's estimated duration.
3. **Given** completed work today already meets or exceeds the daily budget, **When** the user views remaining capacity, **Then** the app shows zero remaining (not a negative number) in the same calm, simple style.

---

### User Story 3 - Get a calm nudge, never a block, when over-planning (Priority: P1)

A user plans more for today than their stated budget allows. Bitir points this out gently — the plan is roughly double the available time, say — and suggests letting some of it wait until tomorrow, but never prevents the user from proceeding as planned. The choice always stays with the user.

**Why this priority**: This is the direct antidote to the "planned 15, did 3" problem the feature exists to solve — but it only adds value once a budget (US1) exists to compare the plan against.

**Independent Test**: Set a daily budget, plan enough active work to exceed it, and confirm a calm advisory message appears while all normal task actions remain fully available and unblocked.

**Acceptance Scenarios**:

1. **Given** a daily budget is set, **When** the total estimated duration of today's planned tasks exceeds the budget, **Then** the app shows a calm, non-blocking message noting the mismatch and suggesting some work could wait.
2. **Given** the over-budget message is showing, **When** the user takes any normal action (add a task, complete a task, get a recommendation), **Then** the action proceeds normally — nothing is disabled or requires dismissing the message first.
3. **Given** today's planned total is at or under the budget, **When** the user views the app, **Then** no over-budget message appears.

---

### User Story 4 - Leave each day feeling what got finished (Priority: P1)

Whenever the user completes a task, and especially by the end of the day, Bitir reflects back what they actually accomplished — how many tasks, how much time's worth of work — in a way that feels like momentum, not a scoreboard of what's left. Nothing about tasks left undone or piling up ever appears in this feedback.

**Why this priority**: This is the emotional core the whole feature is built around — replacing end-of-day guilt with a sense of accomplishment — and it's usable standalone as soon as at least one task has been completed today.

**Independent Test**: Complete one or more tasks in a day and confirm the app shows a positive summary (count completed, time completed) that contains no mention of remaining, overdue, or undone work.

**Acceptance Scenarios**:

1. **Given** the user completes a task, **When** they view today's progress feedback, **Then** it shows the count of tasks completed today and the total time they represent.
2. **Given** the user has completed zero tasks today, **When** they view today's progress feedback, **Then** the app shows a calm, encouraging starting state — not a warning, count of pending work, or guilt-inducing message.
3. **Given** any day's progress feedback is shown, **When** the user reads it, **Then** it contains no counts, mentions, or visual emphasis of tasks that are active, faded, archived, or otherwise unfinished.

---

### User Story 5 - See your finishing momentum build over time (Priority: P2)

Beyond a single day, the user can glance at a simple view of the last 7 days' finishing activity — a track record built entirely from what they completed, never from what they didn't — including how many consecutive recent days they've kept the finishing habit going.

**Why this priority**: This extends the same accomplishment-first feedback loop (User Story 4) across days, reinforcing the habit — but the app already delivers its core value within a single day via User Stories 1-4, so this can follow once that loop is proven.

**Independent Test**: Complete tasks across more than one day and confirm a history view shows completed-task activity per day for the last 7 days plus a current streak count, with no reference to unfinished or leftover work on any day shown.

**Acceptance Scenarios**:

1. **Given** the user has completed tasks on multiple recent days, **When** they open the progress history view, **Then** they see, for each of the last 7 calendar days, how many tasks were completed (and/or how much time they represent).
2. **Given** a day in the history view had zero completions, **When** the user looks at that day, **Then** it is shown neutrally (e.g., as a quiet gap) without any negative framing.
3. **Given** the progress history view is shown, **When** the user reads it, **Then** it contains no counts or mentions of tasks that were not completed.
4. **Given** the user has completed at least one task on each of several most-recent consecutive days, **When** they view the history, **Then** the app shows the current streak as that count of consecutive days.
5. **Given** the most recent day (yesterday, if today has no completions yet) had zero completions, **When** the user views the streak, **Then** the streak is shown as reset (0 or restarting), stated plainly without negative or blaming language.

---

### Edge Cases

- What happens when the user hasn't set a daily budget yet and tries to view remaining capacity or the over-budget nudge? Both MUST be withheld (nothing to compare against) until a budget is set; the app MUST NOT block other functionality while a budget is unset.
- What happens at midnight / when a new day begins? Today's budget and today's completed-task feedback MUST reset to a fresh, unset/empty state for the new day; the previous day's completions become part of the history view (User Story 5), not today's feedback.
- What happens if the user completes a task whose duration alone exceeds the remaining capacity (e.g., 40 minutes remaining, a 60-minute task gets completed anyway, perhaps outside the recommendation flow)? Remaining capacity MUST simply floor at zero, not go negative or produce an error.
- What happens if the recommendation engine's requested time-and-energy criteria (existing feature) allows more time than remains in today's capacity? The recommendation engine MUST additionally respect the smaller of the two — it MUST NOT recommend a task whose duration exceeds today's remaining capacity, even if the entered available-time value is larger.
- What happens to the over-budget nudge once the user completes enough work to bring the plan back under budget? It MUST stop appearing — the comparison is live against current remaining plan vs. remaining capacity, not a one-time check.
- What happens to the finishing streak (FR-014) when a day passes with zero completions? The streak count MUST reset to reflect the break, stated as a plain fact (e.g., a reset counter), never as a loss, warning, or guilt-inducing message — consistent with the no-blame tone required elsewhere in this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let the user enter a daily time budget for today, expressed as a duration.
- **FR-002**: The user MUST enter today's budget manually each day; the system MUST NOT pre-fill it from a stored default or a prior day's value.
- **FR-003**: "Today's planned tasks" MUST be every task currently in the active list (including faded tasks, per the existing fading feature), with no separate per-task "planned for today" marking step required.
- **FR-004**: System MUST compute the total estimated duration of today's planned tasks (per FR-003) and compare it against today's budget (per FR-001).
- **FR-005**: When today's planned total exceeds today's budget, the system MUST display a calm, non-blocking advisory message suggesting some work could be deferred, without preventing any other action.
- **FR-006**: The over-budget advisory (FR-005) MUST re-evaluate live as planned tasks change or complete, appearing only while the condition holds and disappearing once it no longer does.
- **FR-007**: System MUST display today's remaining capacity (today's budget minus the total estimated duration of tasks completed today) in a simple, single-glance form at all times a budget is set.
- **FR-008**: Remaining capacity (FR-007) MUST never display as negative; it floors at zero once completed work meets or exceeds the budget.
- **FR-009**: The recommendation engine MUST NOT recommend a task whose estimated duration exceeds today's remaining capacity, whenever a daily budget is set, in addition to its existing time/energy suitability rules.
- **FR-010**: System MUST show a same-day progress summary reflecting the count of tasks completed today and the total time they represent, updating as each task is completed.
- **FR-011**: The same-day progress summary (FR-010) and any historical progress view (FR-013) MUST NOT display, count, or otherwise reference tasks that are active, faded, archived, or otherwise unfinished.
- **FR-012**: When zero tasks have been completed today, the same-day progress summary MUST show a calm, neutral starting state rather than an empty, warning, or guilt-inducing message.
- **FR-013**: System MUST provide a history view showing, per recent day, the count of tasks completed (and/or time represented), built solely from completed-task data.
- **FR-014**: The history view (FR-013) MUST cover the most recent 7 calendar days and MUST additionally show the user's current finishing streak — the count of consecutive recent days (ending today or the last day with any completion) that each had at least one completed task.
- **FR-015**: Today's budget and same-day progress summary MUST reset to a fresh, unset/empty state at the start of a new day; the prior day's completions become part of the history view rather than "today."

### Key Entities

- **Daily Capacity**: A single day's user-declared time budget (a duration) and the running total of estimated duration for tasks completed that same day, from which remaining capacity is derived. Scoped to one calendar day; resets each day per FR-015.
- **Task** (existing entity, reused): Its existing `estimated_duration_minutes` and `completed_at` timestamp are the sole inputs to daily-capacity totals and progress feedback — no new attributes are added to Task by this feature.
- **Progress History**: A derived, read-only view over the last 7 calendar days of previously completed tasks' `completed_at` dates and durations, grouped by day, plus a derived current streak (count of consecutive recent days with at least one completion), used to render the multi-day momentum view (User Story 5). Not a separately stored entity beyond what Task already records — both the per-day breakdown and the streak are computed from existing completion data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can set today's time budget and see it reflected in the app in under 10 seconds.
- **SC-002**: Remaining capacity shown is accurate to the minute against actual completed-task durations in 100% of observed cases.
- **SC-003**: 100% of over-budget nudges are dismissible-by-ignoring — no user action is ever blocked or requires interacting with the nudge first.
- **SC-004**: 100% of same-day and historical progress views contain zero references to unfinished, active, faded, or archived work.
- **SC-005**: 100% of recommendations shown, when a daily budget is set, fit within the remaining daily capacity at the time they are shown.
- **SC-006**: Users report (qualitatively, via their own continued use) that end-of-day review feels like an account of accomplishment rather than a list of shortfalls.

## Assumptions

- **Single daily budget per day**: Only one budget value is in effect per calendar day; the feature does not support multiple budgets or re-budgeting mid-day beyond simply changing the entered value (which takes effect immediately for future comparisons).
- **Day boundary uses local calendar days**: "Today" and "a new day begins" are based on the user's local calendar date, consistent with how the existing fading feature already reasons about day-based thresholds.
- **No new task attributes**: This feature computes entirely from existing `estimated_duration_minutes` and `completed_at` — it does not require tagging tasks with a duration-to-date budget category or similar.
- **Advisory tone matches existing product voice**: The over-budget message and progress feedback follow the same calm, non-shaming visual/textual language already established by the fading feature's "quiet, non-shaming" transitions.
- **History view is read-only**: The multi-day progress view (User Story 5) has no interactive actions of its own — it is a passive reflection, not a place to manage tasks.
- **No new "defer to tomorrow" action**: The over-budget nudge (User Story 3) is purely advisory text; it does not introduce a new interactive mechanism to explicitly move a task to tomorrow. A task not completed today simply remains an active task tomorrow by default, which already achieves the suggested effect without new scope.
