import type { Task } from "../api/tasks";
import { buildHistory, computeStreak, sumDurationMinutes, todayKey, toLocalDateKey } from "../lib/dailyCapacity";

interface ProgressPanelProps {
  completedTasks: Task[];
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

function ProgressPanel({ completedTasks }: ProgressPanelProps) {
  const today = todayKey();
  const completedToday = completedTasks.filter(
    (task) => task.completed_at && toLocalDateKey(task.completed_at) === today,
  );
  const completedCountToday = completedToday.length;
  const completedMinutesToday = sumDurationMinutes(completedToday);

  const history = buildHistory(completedTasks);
  const streak = computeStreak(history);

  return (
    <div className="progress-panel">
      {completedCountToday === 0 ? (
        <p className="progress-panel__empty">
          Nothing finished yet today — it'll show up here as soon as you complete your first task.
        </p>
      ) : (
        <p className="progress-panel__summary">
          You've finished {completedCountToday} {completedCountToday === 1 ? "task" : "tasks"}
          today — {formatMinutes(completedMinutesToday)} worth of work done.
        </p>
      )}

      <div className="progress-panel__history">
        {history.map((day) => (
          <div
            key={day.dateKey}
            className={
              day.completedCount > 0
                ? "progress-panel__day progress-panel__day--active"
                : "progress-panel__day"
            }
            title={day.dateKey}
          >
            <span className="progress-panel__day-count">{day.completedCount}</span>
          </div>
        ))}
      </div>

      <p className="progress-panel__streak">
        {streak > 0
          ? `${streak}-day finishing streak.`
          : "Streak is at zero right now — you can start a new one today."}
      </p>
    </div>
  );
}

export default ProgressPanel;
