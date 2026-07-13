import type { Task } from "../api/tasks";

interface TaskListItemProps {
  task: Task;
  onComplete?: (taskId: number) => void;
  onRevive?: (taskId: number) => void;
  onToggleExempt?: (taskId: number, exempt: boolean) => void;
  onSetDueDate?: (taskId: number, dueDate: string | null) => void;
}

function TaskListItem({
  task,
  onComplete,
  onRevive,
  onToggleExempt,
  onSetDueDate,
}: TaskListItemProps) {
  const className =
    task.status === "faded" ? "task-list-item task-list-item--faded" : "task-list-item";
  const canRevive = task.status === "faded" || task.status === "archived";
  const canToggleExempt = task.status === "active" || task.status === "faded";

  return (
    <li className={className}>
      <div>
        <div className="task-list-item__title">{task.title}</div>
        <div className="task-list-item__meta">
          {task.estimated_duration_minutes} min · {task.energy_level} energy
        </div>
      </div>
      {onComplete && task.status !== "archived" && (
        <button
          type="button"
          className="task-list-item__complete"
          aria-label={`Mark "${task.title}" as complete`}
          onClick={() => onComplete(task.id)}
        >
          ✓
        </button>
      )}
      {onRevive && canRevive && (
        <button
          type="button"
          className="task-list-item__revive"
          aria-label={`Revive "${task.title}"`}
          onClick={() => onRevive(task.id)}
        >
          Revive
        </button>
      )}
      {onToggleExempt && canToggleExempt && (
        <button
          type="button"
          className={
            task.fading_exempt
              ? "task-list-item__pin task-list-item__pin--active"
              : "task-list-item__pin"
          }
          aria-label={
            task.fading_exempt
              ? `Unpin "${task.title}" (allow it to fade)`
              : `Pin "${task.title}" (exempt it from fading)`
          }
          onClick={() => onToggleExempt(task.id, !task.fading_exempt)}
        >
          📌
        </button>
      )}
      {onSetDueDate && canToggleExempt && (
        <input
          type="date"
          className="task-list-item__due-date"
          aria-label={`Due date for "${task.title}"`}
          value={task.due_date ?? ""}
          onChange={(event) => onSetDueDate(task.id, event.target.value || null)}
        />
      )}
    </li>
  );
}

export default TaskListItem;
