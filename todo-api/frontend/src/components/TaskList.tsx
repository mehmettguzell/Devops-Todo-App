import type { Task } from "../api/tasks";
import TaskListItem from "./TaskListItem";

interface TaskListProps {
  tasks: Task[];
  onComplete?: (taskId: number) => void;
}

function TaskList({ tasks, onComplete }: TaskListProps) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} onComplete={onComplete} />
      ))}
    </ul>
  );
}

export default TaskList;
