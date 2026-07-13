import { useEffect, useRef, useState } from "react";
import { completeTask, listTasks, reviveTask, updateTaskFading, type Task } from "./api/tasks";
import AddTaskModal from "./components/AddTaskModal";
import EmptyState from "./components/EmptyState";
import FadingSettingsModal from "./components/FadingSettingsModal";
import RecommendationCard from "./components/RecommendationCard";
import RecommendationPanel from "./components/RecommendationPanel";
import TaskList from "./components/TaskList";
import { isSuitable, pickRecommendation, type RecommendationRequest } from "./lib/recommendation";

type View = "active" | "completed" | "archive";

function App() {
  const [view, setView] = useState<View>("active");
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const completingTaskIds = useRef(new Set<number>());
  const [recommendationRequest, setRecommendationRequest] = useState<RecommendationRequest | null>(
    null,
  );
  const [declinedTaskIds, setDeclinedTaskIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    listTasks("active").then(setActiveTasks);
    listTasks("completed").then(setCompletedTasks);
    listTasks("archived").then(setArchivedTasks);
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

  async function handleRevive(taskId: number) {
    const revived = await reviveTask(taskId);
    setArchivedTasks((tasks) => tasks.filter((task) => task.id !== taskId));
    setActiveTasks((tasks) => [revived, ...tasks.filter((task) => task.id !== taskId)]);
  }

  async function handleToggleExempt(taskId: number, exempt: boolean) {
    const updated = await updateTaskFading(taskId, { fading_exempt: exempt });
    setActiveTasks((tasks) => tasks.map((task) => (task.id === taskId ? updated : task)));
  }

  async function handleSetDueDate(taskId: number, dueDate: string | null) {
    const updated = await updateTaskFading(taskId, { due_date: dueDate });
    setActiveTasks((tasks) => tasks.map((task) => (task.id === taskId ? updated : task)));
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
        <div className="page-header__controls">
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
            <button
              type="button"
              className={view === "archive" ? "view-tab view-tab--selected" : "view-tab"}
              onClick={() => setView("archive")}
            >
              Archive
            </button>
          </nav>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIsEditingSettings(true)}
          >
            Settings
          </button>
        </div>
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
              <TaskList
                tasks={activeTasks}
                onComplete={handleComplete}
                onRevive={handleRevive}
                onToggleExempt={handleToggleExempt}
                onSetDueDate={handleSetDueDate}
              />
            )}
          </>
        ) : view === "completed" ? (
          completedTasks.length === 0 ? (
            <EmptyState message="Nothing completed yet — finished tasks will show up here." />
          ) : (
            <TaskList tasks={completedTasks} />
          )
        ) : archivedTasks.length === 0 ? (
          <EmptyState message="Nothing archived — neglected tasks will quietly land here." />
        ) : (
          <TaskList tasks={archivedTasks} onRevive={handleRevive} />
        )}
      </div>

      {isAddingTask && (
        <AddTaskModal onClose={() => setIsAddingTask(false)} onCreated={handleTaskCreated} />
      )}
      {isEditingSettings && (
        <FadingSettingsModal onClose={() => setIsEditingSettings(false)} />
      )}
    </main>
  );
}

export default App;
