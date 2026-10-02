import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clock } from '../../../core/services/clock';
import { TaskDialogs } from '../../../core/services/task-dialogs';
import { Tasks } from '../../../core/services/tasks';
import { slotForHour, Task } from '../../../models/task';
import { toDateKey } from '../../../shared/dates';
import { SnoozeOption, snoozeOptions } from '../../../shared/snooze';

/**
 * Il bottone ⋮ con le azioni di un task: Modifica, Rimanda (sottomenu), Elimina.
 * È un componente a sé perché serve uguale sia nel pannello sia nella modale.
 */
@Component({
  selector: 'app-task-actions-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './task-actions-menu.html',
  styleUrl: './task-actions-menu.scss',
})
export class TaskActionsMenu {
  task = input.required<Task>();

  private tasks = inject(Tasks);
  private dialogs = inject(TaskDialogs);
  private clock = inject(Clock);
  // la "notifica" in basso che compare per qualche secondo
  private snackBar = inject(MatSnackBar);

  // Due signal che cambiano poche volte al giorno (giorno e momento), anche se il Clock batte ogni secondo:
  // computed confronta il risultato e, se è uguale a prima, non avvisa chi dipende da lui.
  private todayKey = computed(() => toDateKey(this.clock.now()));
  private currentSlot = computed(() => slotForHour(this.clock.now().getHours()));

  protected snoozeOptions = computed(() => snoozeOptions(this.task(), this.todayKey(), this.currentSlot()));

  protected edit(): void {
    this.dialogs.openForm(this.task());
  }

  protected snooze(option: SnoozeOption): void {
    this.tasks.update(this.task().id, option.changes).subscribe({
      next: () => this.notify(`Rimandato a ${option.hint}`),
      error: () => this.notify('Non sono riuscito a rimandarlo, riprova'),
    });
  }

  protected remove(): void {
    // eliminare non si può annullare: chiedo conferma con la finestrina del browser
    if (!confirm(`Eliminare "${this.task().title}"?`)) {
      return;
    }
    this.tasks.remove(this.task().id).subscribe({
      next: () => this.notify('Task eliminato'),
      error: () => this.notify('Non sono riuscito a eliminarlo, riprova'),
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
