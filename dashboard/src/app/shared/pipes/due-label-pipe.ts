import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { Task, TASK_SLOT_LABELS } from '../../models/task';
import { relativeDayLabel } from '../dates';

/**
 * La scadenza di un task in parole: {{ task | dueLabel: clock.now() }}
 *   -> "Oggi · Mattina", "Domani", "sab 3 ott · Sera", "Senza data"
 * "now" è un parametro (e non new Date() qui dentro) perché la pipe è PURA:
 * Angular la ricalcola solo quando cambia un argomento, quindi "adesso" deve arrivare da fuori.
 */
@Pipe({
  name: 'dueLabel',
})
export class DueLabelPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(task: Task, now: Date): string {
    if (task.dueDate === null) {
      return 'Senza data';
    }
    const day = relativeDayLabel(task.dueDate, now, 'EEE d MMM', this.locale);
    return task.dueSlot ? `${day} · ${TASK_SLOT_LABELS[task.dueSlot]}` : day;
  }
}
