import { computed, Directive, inject, input } from '@angular/core';
import { Clock } from '../../core/services/clock';
import { isOverdue, Task } from '../../models/task';
import { toDateKey } from '../dates';

/**
 * Direttiva: aggiunge un "comportamento" a un elemento che esiste già, senza un template suo.
 * Uso: <li [appOverdue]="task"> ... </li>
 * Se il task è scaduto, l'elemento riceve la classe CSS "overdue" e il tooltip "Scaduto".
 * Che aspetto abbia un elemento "overdue" lo decide il CSS del componente che la usa.
 */
@Directive({
  selector: '[appOverdue]',
  host: {
    '[class.overdue]': 'overdue()',
    '[attr.title]': "overdue() ? 'Scaduto' : null", // null = nessun attributo title
  },
})
export class Overdue {
  // alias: l'input si chiama come la direttiva, così si scrive [appOverdue]="task" in un colpo solo
  task = input.required<Task>({ alias: 'appOverdue' });

  private clock = inject(Clock);

  // col Clock, un task di oggi diventa "scaduto" da solo a mezzanotte, senza ricaricare
  protected overdue = computed(() => isOverdue(this.task(), toDateKey(this.clock.now())));
}
