import type { Task } from "../api/tasks";

export interface DailyHistoryDay {
  dateKey: string;
  completedCount: number;
  completedMinutes: number;
}

const BUDGET_STORAGE_PREFIX = "bitir:dailyBudgetMinutes:";

export function toLocalDateKey(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toLocalDateKey(new Date().toISOString());
}

export function sumDurationMinutes(tasks: Task[]): number {
  return tasks.reduce((total, task) => total + task.estimated_duration_minutes, 0);
}

export function getStoredBudgetMinutes(dateKey: string): number | null {
  const raw = localStorage.getItem(`${BUDGET_STORAGE_PREFIX}${dateKey}`);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setStoredBudgetMinutes(dateKey: string, minutes: number): void {
  localStorage.setItem(`${BUDGET_STORAGE_PREFIX}${dateKey}`, String(minutes));
}

export function remainingCapacityMinutes(
  budgetMinutes: number,
  completedTodayMinutes: number,
): number {
  return Math.max(0, budgetMinutes - completedTodayMinutes);
}

export function buildHistory(completedTasks: Task[], days = 7): DailyHistoryDay[] {
  const byDateKey = new Map<string, { completedCount: number; completedMinutes: number }>();
  for (const task of completedTasks) {
    if (!task.completed_at) continue;
    const dateKey = toLocalDateKey(task.completed_at);
    const bucket = byDateKey.get(dateKey) ?? { completedCount: 0, completedMinutes: 0 };
    bucket.completedCount += 1;
    bucket.completedMinutes += task.estimated_duration_minutes;
    byDateKey.set(dateKey, bucket);
  }

  const today = new Date();
  const history: DailyHistoryDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const dateKey = toLocalDateKey(day.toISOString());
    const bucket = byDateKey.get(dateKey) ?? { completedCount: 0, completedMinutes: 0 };
    history.push({ dateKey, ...bucket });
  }

  return history;
}

export function computeStreak(history: DailyHistoryDay[]): number {
  const days = [...history].reverse();
  let startIndex = 0;
  if (days.length > 0 && days[0].completedCount === 0) {
    startIndex = 1;
  }

  let streak = 0;
  for (let i = startIndex; i < days.length; i += 1) {
    if (days[i].completedCount >= 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
