import type { Task } from "../api/tasks";

interface RecommendationCardProps {
  task: Task;
  onComplete: (taskId: number) => void;
  onNotNow: (taskId: number) => void;
  onDismiss: () => void;
}

function RecommendationCard({ task, onComplete, onNotNow, onDismiss }: RecommendationCardProps) {
  return (
    <div className="recommendation-card">
      <div className="recommendation-card__title">{task.title}</div>
      <div className="recommendation-card__meta">
        {task.estimated_duration_minutes} min · {task.energy_level} energy
      </div>
      <div className="recommendation-card__actions">
        <button type="button" onClick={() => onComplete(task.id)}>
          Complete
        </button>
        <button type="button" onClick={() => onNotNow(task.id)}>
          Not now
        </button>
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default RecommendationCard;
