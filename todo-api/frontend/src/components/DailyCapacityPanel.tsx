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
  if (hours === 0) return `${mins} dakika`;
  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dakika`;
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
          Bugün işlere ne kadar zaman ayırabilirsin?
        </p>
        <div className="daily-capacity-panel__fields">
          <div className="daily-capacity-panel__field">
            <label htmlFor="daily-budget-hours">Saat</label>
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
            <label htmlFor="daily-budget-minutes">Dakika</label>
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
          Bugünün bütçesini belirle
        </button>
      </form>
    );
  }

  return (
    <div className="daily-capacity-panel">
      <p className="daily-capacity-panel__remaining">
        {formatMinutes(budgetMinutes)} bütçenden {formatMinutes(remainingMinutes)} kaldı.
      </p>
      {isOverPlanned && (
        <p className="daily-capacity-panel__nudge">
          Bugün için planladığın işler ayırdığın zamandan fazla — bir kısmını yarına bırakmak
          ister misin?
        </p>
      )}
    </div>
  );
}

export default DailyCapacityPanel;
