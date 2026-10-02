import { Task, TASK_SLOT_LABELS, TaskChanges, TaskSlot } from '../models/task';
import { addDays, fromDateKey, nextMonday } from './dates';

/** Una voce del menu "Rimanda": cosa mostrare e cosa mandare all'API. */
export interface SnoozeOption {
  label: string;
  /** La nuova scadenza in parole, es. "domani sera". */
  hint: string;
  changes: TaskChanges;
}

/**
 * Le possibili nuove scadenze per un task, calcolate da "adesso".
 * Funzione "pura": stessi argomenti -> stesso risultato, niente Date.now() nascosti dentro.
 * Così è facile da testare e Angular la ricalcola solo quando cambiano giorno o momento della giornata.
 */
export function snoozeOptions(task: Task, todayKey: string, currentSlot: TaskSlot): SnoozeOption[] {
  // "Più tardi" = il prossimo momento della giornata; dopo la sera c'è domattina.
  const later: TaskChanges =
    currentSlot === 'morning'
      ? { dueDate: todayKey, dueSlot: 'afternoon' }
      : currentSlot === 'afternoon'
        ? { dueDate: todayKey, dueSlot: 'evening' }
        : { dueDate: addDays(todayKey, 1), dueSlot: 'morning' };

  // Per gli altri giorni tengo il momento che il task aveva già (se era "sera", resta "sera").
  const sameSlot = task.dueSlot;

  return [
    { label: 'Più tardi', hint: describe(later, todayKey), changes: later },
    option('Domani', addDays(todayKey, 1), sameSlot, todayKey),
    option('Lunedì', nextMonday(todayKey), sameSlot, todayKey),
    option('Tra una settimana', addDays(todayKey, 7), sameSlot, todayKey),
  ];
}

function option(label: string, dueDate: string, dueSlot: TaskSlot | null, todayKey: string): SnoozeOption {
  const changes: TaskChanges = { dueDate, dueSlot };
  return { label, hint: describe(changes, todayKey), changes };
}

/** { dueDate: domani, dueSlot: 'evening' } -> "domani sera" (usato nel menu e nel messaggio di conferma). */
function describe(changes: TaskChanges, todayKey: string): string {
  const day =
    changes.dueDate === todayKey
      ? 'oggi'
      : changes.dueDate === addDays(todayKey, 1)
        ? 'domani'
        : fromDateKey(changes.dueDate ?? todayKey).toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
  return changes.dueSlot ? `${day} ${TASK_SLOT_LABELS[changes.dueSlot].toLowerCase()}` : day;
}
