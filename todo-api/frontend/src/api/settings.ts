const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface FadingSettings {
  fade_threshold_days: number;
  archive_threshold_days: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getFadingSettings(): Promise<FadingSettings> {
  return request<FadingSettings>("/settings/fading");
}

export function updateFadingSettings(input: FadingSettings): Promise<FadingSettings> {
  return request<FadingSettings>("/settings/fading", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
