import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Clock } from '../../../core/services/clock';
import { TaskDialogs } from '../../../core/services/task-dialogs';
import { Tasks } from '../../../core/services/tasks';
import { isOverdue, Task } from '../../../models/task';
import { toDateKey } from '../../../shared/dates';
import { Overdue } from '../../../shared/directives/overdue';
import { DueLabelPipe } from '../../../shared/pipes/due-label-pipe';
import { PriorityDot } from '../../tasks/priority-dot/priority-dot';
import { TaskActionsMenu } from '../../tasks/task-actions-menu/task-actions-menu';

/**
 * Il pannello Task: TUTTI i task da fare in un'unica lista (nell'ordine del server: priorità, poi data).
 * In alto "+ Nuovo" e ⚙️, che apre la finestra con tutti i task, i filtri e la selezione multipla.
 */
@Component({
  selector: 'app-tasks-panel',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, DueLabelPipe, Overdue, PriorityDot, TaskActionsMenu],
  templateUrl: './tasks-panel.html',
  styleUrl: './tasks-panel.scss',
})
export class TasksPanel {
  protected tasks = inject(Tasks);
  protected dialogs = inject(TaskDialogs);
  protected clock = inject(Clock);
  protected errorMessage = signal<string | null>(null);

  //computed= una funzione che ritorna un valore calcolato in base a un altro valore. Quando cambia la lista (dopo un reload) o cambia il giorno, Angular ricalcola solo le formule che ne dipendono.
  //signal= una variabile che può cambiare nel tempo. Quando cambia, tutti i componenti che la usano vengono aggiornati automaticamente.

  //la data di oggi come '2026-10-01'; cambia da sola a mezzanotte
  private todayKey = computed(() => toDateKey(this.clock.now()));

  //tutti quelli ancora da fare (gli scaduti compresi: li evidenzia la direttiva appOverdue)
  protected openTasks = computed(() => this.tasks.tasks().filter((t) => t.completedAt === null));

  //quanti sono scaduti: per la scritta in alto
  protected overdueCount = computed(() => this.openTasks().filter((t) => isOverdue(t, this.todayKey())).length);

  protected toggle(task: Task): void {
    this.errorMessage.set(null);
    this.tasks.update(task.id, { completed: task.completedAt === null }).subscribe({
      error: () => this.errorMessage.set('Non sono riuscito a salvare, riprova'),
    });
  }
}
