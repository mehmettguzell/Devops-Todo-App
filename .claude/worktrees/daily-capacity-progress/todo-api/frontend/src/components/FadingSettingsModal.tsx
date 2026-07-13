import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getFadingSettings, updateFadingSettings } from "../api/settings";

interface FadingSettingsModalProps {
  onClose: () => void;
}

function FadingSettingsModal({ onClose }: FadingSettingsModalProps) {
  const [fadeThresholdDays, setFadeThresholdDays] = useState("");
  const [archiveThresholdDays, setArchiveThresholdDays] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getFadingSettings().then((settings) => {
      setFadeThresholdDays(String(settings.fade_threshold_days));
      setArchiveThresholdDays(String(settings.archive_threshold_days));
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const fade = Number(fadeThresholdDays);
    const archive = Number(archiveThresholdDays);

    if (!fadeThresholdDays || Number.isNaN(fade) || fade <= 0) {
      setError("Fade threshold must be a positive number of days.");
      return;
    }
    if (!archiveThresholdDays || Number.isNaN(archive) || archive <= 0) {
      setError("Archive threshold must be a positive number of days.");
      return;
    }
    if (archive <= fade) {
      setError("Archive threshold must be greater than the fade threshold.");
      return;
    }

    setSubmitting(true);
    try {
      await updateFadingSettings({
        fade_threshold_days: fade,
        archive_threshold_days: archive,
      });
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
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
        aria-label="Fading settings"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>Fading settings</h2>

        <label>
          Fade after (days of no touch)
          <input
            type="number"
            min={1}
            value={fadeThresholdDays}
            onChange={(event) => setFadeThresholdDays(event.target.value)}
          />
        </label>

        <label>
          Archive after (days of no touch)
          <input
            type="number"
            min={1}
            value={archiveThresholdDays}
            onChange={(event) => setArchiveThresholdDays(event.target.value)}
          />
        </label>

        {error && <span className="field-error">{error}</span>}

        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={submitting}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default FadingSettingsModal;
