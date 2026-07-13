import { useEffect, useRef, useState } from "react";
import { completeTask, listTasks, type Task } from "./api/tasks";
import AddTaskModal from "./components/AddTaskModal";
import EmptyState from "./components/EmptyState";
import RecommendationCard from "./components/RecommendationCard";
import RecommendationPanel from "./components/RecommendationPanel";
import TaskList from "./components/TaskList";
import { isSuitable, pickRecommendation, type RecommendationRequest } from "./lib/recommendation";

type View = "active" | "completed";

function App() {
  const [view, setView] = useState<View>("active");
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const completingTaskIds = useRef(new Set<number>());
  const [recommendationRequest, setRecommendationRequest] = useState<RecommendationRequest | null>(
    null,
  );
  const [declinedTaskIds, setDeclinedTaskIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    listTasks("active").then(setActiveTasks);
    listTasks("completed").then(setCompletedTasks);
  }, []);

  function handleTaskCreated(task: Task) {
    setActiveTasks((tasks) => [task, ...tasks]);
  }

  async function handleComplete(taskId: number) {
    if (completingTaskIds.current.has(taskId)) return;
    completingTaskIds.current.add(taskId);

    setActiveTasks((tasks) => tasks.filter((task) => task.id !== taskId));
    try {
      const completedTask = await completeTask(taskId);
      setCompletedTasks((tasks) => [completedTask, ...tasks]);
    } finally {
      completingTaskIds.current.delete(taskId);
    }
  }

  function handleRecommendationSubmit(request: RecommendationRequest) {
    setRecommendationRequest(request);
    setDeclinedTaskIds(new Set());
  }

  async function handleRecommendationComplete(taskId: number) {
    await handleComplete(taskId);
    setRecommendationRequest(null);
    setDeclinedTaskIds(new Set());
  }

  function handleRecommendationNotNow(taskId: number) {
    setDeclinedTaskIds((ids) => new Set(ids).add(taskId));
  }

  function handleRecommendationDismiss() {
    setRecommendationRequest(null);
    setDeclinedTaskIds(new Set());
  }

  const recommendedTask = recommendationRequest
    ? pickRecommendation(activeTasks, recommendationRequest, declinedTaskIds)
    : undefined;
  const hasAnySuitableTask = recommendationRequest
    ? activeTasks.some((task) => isSuitable(task, recommendationRequest))
    : false;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Bitir</h1>
        <nav className="view-nav">
          <button
            type="button"
            className={view === "active" ? "view-tab view-tab--selected" : "view-tab"}
            onClick={() => setView("active")}
          >
            Active
          </button>
          <button
            type="button"
            className={view === "completed" ? "view-tab view-tab--selected" : "view-tab"}
            onClick={() => setView("completed")}
          >
            Completed
          </button>
        </nav>
      </header>

      <div className="page-content">
        {view === "active" ? (
          <>
            <div className="recommendation-area">
              {recommendedTask ? (
                <RecommendationCard
                  task={recommendedTask}
                  onComplete={handleRecommendationComplete}
                  onNotNow={handleRecommendationNotNow}
                  onDismiss={handleRecommendationDismiss}
                />
              ) : (
                <>
                  {recommendationRequest &&
                    (hasAnySuitableTask ? (
                      <EmptyState message="No more alternatives right now — you've seen every task that fits." />
                    ) : (
                      <EmptyState message="You have nothing suitable right now — maybe it's time for a break." />
                    ))}
                  <RecommendationPanel onSubmit={handleRecommendationSubmit} />
                </>
              )}
            </div>

            <button type="button" className="add-task-button" onClick={() => setIsAddingTask(true)}>
              + Add task
            </button>
            {activeTasks.length === 0 ? (
              <EmptyState message="Nothing active right now — add a task to get started." />
            ) : (
              <TaskList tasks={activeTasks} onComplete={handleComplete} />
            )}
          </>
        ) : completedTasks.length === 0 ? (
          <EmptyState message="Nothing completed yet — finished tasks will show up here." />
        ) : (
          <TaskList tasks={completedTasks} />
        )}
      </div>

      {isAddingTask && (
        <AddTaskModal onClose={() => setIsAddingTask(false)} onCreated={handleTaskCreated} />
      )}
    </main>
  );
}

export default App;
