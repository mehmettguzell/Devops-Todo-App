import type { Task } from "../api/tasks";
import { buildHistory, computeStreak, sumDurationMinutes, todayKey, toLocalDateKey } from "../lib/dailyCapacity";

interface ProgressPanelProps {
  completedTasks: Task[];
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} dakika`;
  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dakika`;
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
          Henüz bugün bir şey bitirmedin — ilk işini tamamladığında burada göreceksin.
        </p>
      ) : (
        <p className="progress-panel__summary">
          Bugün {completedCountToday} iş bitirdin — {formatMinutes(completedMinutesToday)}
          {"'"}lık iş tamamladın.
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
          ? `${streak} gündür ardışık bitiriyorsun.`
          : "Seri şu an sıfırda — yeni bir tanesine bugün başlayabilirsin."}
      </p>
    </div>
  );
}

export default ProgressPanel;
