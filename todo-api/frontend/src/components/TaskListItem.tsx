import type { Task } from "../api/tasks";

interface TaskListItemProps {
  task: Task;
  onComplete?: (taskId: number) => void;
}

function TaskListItem({ task, onComplete }: TaskListItemProps) {
  return (
    <li className="task-list-item">
      <div>
        <div className="task-list-item__title">{task.title}</div>
        <div className="task-list-item__meta">
          {task.estimated_duration_minutes} min · {task.energy_level} energy
        </div>
      </div>
      {onComplete && (
        <button
          type="button"
          className="task-list-item__complete"
          aria-label={`Mark "${task.title}" as complete`}
          onClick={() => onComplete(task.id)}
        >
          ✓
        </button>
      )}
    </li>
  );
}

export default TaskListItem;
