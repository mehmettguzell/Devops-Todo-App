import { useState } from "react";
import type { FormEvent } from "react";

interface DailyCapacityPanelProps {
  budgetMinutes: number | null;
  remainingMinutes: number;
  isOverPlanned: boolean;
  onBudgetSet: (minutes: number) => void;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

function DailyCapacityPanel({
  budgetMinutes,
  remainingMinutes,
  isOverPlanned,
  onBudgetSet,
}: DailyCapacityPanelProps) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsedHours = hours === "" ? 0 : Number(hours);
    const parsedMinutes = minutes === "" ? 0 : Number(minutes);
    if (
      !Number.isInteger(parsedHours) ||
      !Number.isInteger(parsedMinutes) ||
      parsedHours < 0 ||
      parsedMinutes < 0
    ) {
      setError("Enter a whole number of hours and/or minutes.");
      return;
    }

    const totalMinutes = parsedHours * 60 + parsedMinutes;
    if (totalMinutes <= 0) {
      setError("Enter a budget greater than 0.");
      return;
    }

    setError(null);
    onBudgetSet(totalMinutes);
  }

  if (budgetMinutes === null) {
    return (
      <form className="daily-capacity-panel" onSubmit={handleSubmit} noValidate>
        <p className="daily-capacity-panel__prompt">
          How much time can you realistically give to tasks today?
        </p>
        <div className="daily-capacity-panel__fields">
          <div className="daily-capacity-panel__field">
            <label htmlFor="daily-budget-hours">Hours</label>
            <input
              id="daily-budget-hours"
              type="number"
              min={0}
              step={1}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </div>
          <div className="daily-capacity-panel__field">
            <label htmlFor="daily-budget-minutes">Minutes</label>
            <input
              id="daily-budget-minutes"
              type="number"
              min={0}
              step={1}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </div>
        </div>
        {error && <p className="daily-capacity-panel__error">{error}</p>}
        <button type="submit" className="daily-capacity-panel__submit">
          Set today's budget
        </button>
      </form>
    );
  }

  return (
    <div className="daily-capacity-panel">
      <p className="daily-capacity-panel__remaining">
        {formatMinutes(remainingMinutes)} left out of your {formatMinutes(budgetMinutes)} budget.
      </p>
      {isOverPlanned && (
        <p className="daily-capacity-panel__nudge">
          Today's planned work adds up to more than you budgeted — maybe let some of it wait
          until tomorrow?
        </p>
      )}
    </div>
  );
}

export default DailyCapacityPanel;
