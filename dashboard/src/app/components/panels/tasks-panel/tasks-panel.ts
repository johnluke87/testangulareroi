import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Clock } from '../../../core/services/clock';
import { TaskDialogs } from '../../../core/services/task-dialogs';
import { Tasks } from '../../../core/services/tasks';
import { isOverdue, Task, TASK_SLOT_LABELS } from '../../../models/task';
import { toDateKey } from '../../../shared/dates';
import { DueLabelPipe } from '../../../shared/pipes/due-label-pipe';
import { PriorityDot } from '../../tasks/priority-dot/priority-dot';
import { TaskActionsMenu } from '../../tasks/task-actions-menu/task-actions-menu';

@Component({
  selector: 'app-tasks-panel',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, DueLabelPipe, PriorityDot, TaskActionsMenu],
  templateUrl: './tasks-panel.html',
  styleUrl: './tasks-panel.scss',
})
export class TasksPanel {
  protected tasks = inject(Tasks);
  protected dialogs = inject(TaskDialogs);
  protected clock = inject(Clock);
  protected slotLabels = TASK_SLOT_LABELS;
  protected errorMessage = signal<string | null>(null);

  //computed= una funzione che ritorna un valore calcolato in base a un altro valore. Quando cambia la lista (dopo un reload) o cambia il giorno, Angular ricalcola solo le formule che ne dipendono.
  //signal= una variabile che può cambiare nel tempo. Quando cambia, tutti i componenti che la usano vengono aggiornati automaticamente.

  //la data di oggi come '2026-10-01'; cambia da sola a mezzanotte
  protected todayKey = computed(() => toDateKey(this.clock.now()));

  //solo quelli ancora da fare
  protected openTasks = computed(() => this.tasks.tasks().filter((t) => t.completedAt === null));

  //da fare, con la data di oggi
  protected todayTasks = computed(() => this.openTasks().filter((t) => t.dueDate === this.todayKey()));

  //da fare, senza data o con data da oggi in poi (quindi niente scaduti), i primi 7
  protected upcomingTasks = computed(() =>
    this.openTasks()
      .filter((t) => t.dueDate === null || t.dueDate >= this.todayKey())
      .slice(0, 7),
  );

  //quanti scaduti ci sono: nel pannello non li mostro, ma avviso che esistono (il clic apre la modale sugli scaduti)
  protected overdueCount = computed(() => this.openTasks().filter((t) => isOverdue(t, this.todayKey())).length);

  //ci sono task per oggi?
  protected showingToday = computed(() => this.todayTasks().length > 0);

  //quelli da mostrare: di oggi se ce ne sono, altrimenti i prossimi
  protected shown = computed(() => (this.showingToday() ? this.todayTasks() : this.upcomingTasks()));

  protected toggle(task: Task): void {
    this.errorMessage.set(null);
    this.tasks.update(task.id, { completed: task.completedAt === null }).subscribe({
      error: () => this.errorMessage.set('Non sono riuscito a salvare, riprova'),
    });
  }
}
