import type { EnergyLevel, Task } from "../api/tasks";

export const ENERGY_LEVELS: EnergyLevel[] = ["low", "medium", "high"];

export interface RecommendationRequest {
  minutes: number;
  energy: EnergyLevel;
}

function energyIndex(energy: EnergyLevel): number {
  return ENERGY_LEVELS.indexOf(energy);
}

export function isSuitable(task: Task, request: RecommendationRequest): boolean {
  return (
    task.estimated_duration_minutes <= request.minutes &&
    energyIndex(task.energy_level) <= energyIndex(request.energy)
  );
}

function pickBest(candidates: Task[]): Task | undefined {
  return candidates.reduce<Task | undefined>((best, task) => {
    if (!best) return task;
    if (task.estimated_duration_minutes !== best.estimated_duration_minutes) {
      return task.estimated_duration_minutes < best.estimated_duration_minutes ? task : best;
    }
    return task.created_at < best.created_at ? task : best;
  }, undefined);
}

export function pickRecommendation(
  tasks: Task[],
  request: RecommendationRequest,
  excludedIds: Set<number>,
): Task | undefined {
  const candidates = tasks.filter((task) => isSuitable(task, request) && !excludedIds.has(task.id));
  const fresh = candidates.filter((task) => task.status !== "faded");
  const faded = candidates.filter((task) => task.status === "faded");

  return pickBest(fresh) ?? pickBest(faded);
}
