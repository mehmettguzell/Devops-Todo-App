import { useState } from "react";
import type { EnergyLevel } from "../api/tasks";
import type { RecommendationRequest } from "../lib/recommendation";

interface RecommendationPanelProps {
  onSubmit: (request: RecommendationRequest) => void;
}

function RecommendationPanel({ onSubmit }: RecommendationPanelProps) {
  const [minutes, setMinutes] = useState("");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedMinutes = Number(minutes);
    if (!Number.isInteger(parsedMinutes) || parsedMinutes <= 0) {
      setError("Enter a whole number of minutes greater than 0.");
      return;
    }

    setError(null);
    onSubmit({ minutes: parsedMinutes, energy });
  }

  return (
    <form className="recommendation-panel" onSubmit={handleSubmit} noValidate>
      <div className="recommendation-panel__field">
        <label htmlFor="recommendation-minutes">Available time (minutes)</label>
        <input
          id="recommendation-minutes"
          type="number"
          min={1}
          step={1}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
        />
      </div>

      <div className="recommendation-panel__field">
        <label htmlFor="recommendation-energy">Current energy</label>
        <select
          id="recommendation-energy"
          value={energy}
          onChange={(event) => setEnergy(event.target.value as EnergyLevel)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {error && <p className="recommendation-panel__error">{error}</p>}

      <button type="submit" className="recommendation-panel__submit">
        Get a recommendation
      </button>
    </form>
  );
}

export default RecommendationPanel;
