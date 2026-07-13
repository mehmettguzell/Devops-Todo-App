export type EnergyLevel = "low" | "medium" | "high";
export type TaskStatus = "active" | "faded" | "archived" | "completed";

export interface Task {
  id: number;
  title: string;
  estimated_duration_minutes: number;
  energy_level: EnergyLevel;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  last_touched_at: string;
  fading_exempt: boolean;
  due_date: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    if (response.status === 422) {
      const body = await response.json();
      const fieldErrors: Record<string, string> = {};
      for (const err of body.detail ?? []) {
        const field = err.loc?.[err.loc.length - 1];
        if (field) fieldErrors[field] = err.msg;
      }
      throw new ApiError("Validation failed", fieldErrors);
    }
    throw new ApiError(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface TaskCreateInput {
  title: string;
  estimated_duration_minutes: number;
  energy_level: EnergyLevel;
  due_date?: string | null;
}

export function createTask(input: TaskCreateInput): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listTasks(taskStatus: TaskStatus): Promise<Task[]> {
  return request<Task[]>(`/tasks?status=${taskStatus}`);
}

export function completeTask(taskId: number): Promise<Task> {
  return request<Task>(`/tasks/${taskId}/complete`, { method: "PATCH" });
}

export function reviveTask(taskId: number): Promise<Task> {
  return request<Task>(`/tasks/${taskId}/revive`, { method: "PATCH" });
}

export function deleteTask(taskId: number): Promise<void> {
  return request<void>(`/tasks/${taskId}`, { method: "DELETE" });
}

export interface TaskFadingUpdateInput {
  fading_exempt?: boolean;
  due_date?: string | null;
}

export function updateTaskFading(taskId: number, input: TaskFadingUpdateInput): Promise<Task> {
  return request<Task>(`/tasks/${taskId}/fading`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
