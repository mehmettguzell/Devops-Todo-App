import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, createTask, type EnergyLevel, type Task } from "../api/tasks";

interface AddTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
}

function AddTaskModal({ onClose, onCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required.";
    const durationValue = Number(duration);
    if (!duration || Number.isNaN(durationValue) || durationValue <= 0) {
      errors.estimated_duration_minutes = "Enter a duration in minutes.";
    }
    if (!energyLevel) errors.energy_level = "Choose an energy level.";
    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        estimated_duration_minutes: Number(duration),
        energy_level: energyLevel as EnergyLevel,
      });
      onCreated(task);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        setFieldErrors({ form: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add task"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>Add task</h2>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </label>

        <label>
          Estimated duration (minutes)
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
          {fieldErrors.estimated_duration_minutes && (
            <span className="field-error">{fieldErrors.estimated_duration_minutes}</span>
          )}
        </label>

        <label>
          Energy level
          <select
            value={energyLevel}
            onChange={(event) => setEnergyLevel(event.target.value as EnergyLevel)}
          >
            <option value="">Select…</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {fieldErrors.energy_level && <span className="field-error">{fieldErrors.energy_level}</span>}
        </label>

        {fieldErrors.form && <span className="field-error">{fieldErrors.form}</span>}

        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={submitting}>
            Add task
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTaskModal;
