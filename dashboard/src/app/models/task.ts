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

/** Filtri della modale con tutti i task. */
export type TaskListFilter = 'open' | 'overdue' | 'done' | 'all';

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

// Gli stessi valori come liste, in ordine: servono ai menu a tendina e ai bottoni del form.
export const TASK_SLOTS: TaskSlot[] = ['morning', 'afternoon', 'evening'];
export const TASK_PRIORITIES: TaskPriority[] = [1, 2, 3];

/** Il momento della giornata di un'ora: prima delle 13 mattina, prima delle 18 pomeriggio, poi sera. */
export function slotForHour(hour: number): TaskSlot {
  if (hour < 13) {
    return 'morning';
  }
  return hour < 18 ? 'afternoon' : 'evening';
}

/** Da fare, con una data già passata. todayKey è la data di oggi 'YYYY-MM-DD'. */
export function isOverdue(task: Task, todayKey: string): boolean {
  // le date 'YYYY-MM-DD' si confrontano anche come testo
  return task.completedAt === null && task.dueDate !== null && task.dueDate < todayKey;
}