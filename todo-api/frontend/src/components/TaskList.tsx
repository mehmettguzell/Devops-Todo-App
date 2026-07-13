import type { Task } from "../api/tasks";
import TaskListItem from "./TaskListItem";

interface TaskListProps {
  tasks: Task[];
  onComplete?: (taskId: number) => void;
  onRevive?: (taskId: number) => void;
  onToggleExempt?: (taskId: number, exempt: boolean) => void;
  onSetDueDate?: (taskId: number, dueDate: string | null) => void;
  onDelete?: (taskId: number) => void;
}

function TaskList({
  tasks,
  onComplete,
  onRevive,
  onToggleExempt,
  onSetDueDate,
  onDelete,
}: TaskListProps) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onRevive={onRevive}
          onToggleExempt={onToggleExempt}
          onSetDueDate={onSetDueDate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TaskList;
