// 1 = alta, 2 = media, 3 = bassa (come nel database)
export type TaskPriority = 1 | 2 | 3;

export type TaskSlot = 'morning' | 'afternoon' | 'evening';

export type TaskStatusFilter = 'open' | 'done' | 'all';

/** Un task come arriva dall'API. */
export interface Task {
  id: number;
  title: string;
  notes: string | null;
  priority: TaskPriority;
  /** Data di calendario 'YYYY-MM-DD', senza ora né fuso. */
  dueDate: string | null;
  dueSlot: TaskSlot | null;
  /** Istante ISO in UTC, es. '2026-10-01T08:30:00Z'. null = da fare. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Quello che mandiamo per creare un task (POST /tasks). */
export interface NewTask {
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  dueSlot?: TaskSlot | null;
}

/** Quello che mandiamo per modificarlo (PATCH /tasks/:id): solo i campi che cambiano. */
export type TaskChanges = Partial<NewTask> & { completed?: boolean };

export const TASK_SLOT_LABELS: Record<TaskSlot, string> = {
  morning: 'Mattina', 
  afternoon: 'Pomeriggio',
  evening: 'Sera',
};
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  1: 'Alta',
  2: 'Media',
  3: 'Bassa',
};