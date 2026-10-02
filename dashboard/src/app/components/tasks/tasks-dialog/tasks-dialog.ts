import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Clock } from '../../../core/services/clock';
import { TaskDialogs } from '../../../core/services/task-dialogs';
import { Tasks } from '../../../core/services/tasks';
import { isOverdue, Task, TaskListFilter } from '../../../models/task';
import { toDateKey } from '../../../shared/dates';
import { Overdue } from '../../../shared/directives/overdue';
import { DueLabelPipe } from '../../../shared/pipes/due-label-pipe';
import { PriorityDot } from '../priority-dot/priority-dot';
import { TaskActionsMenu } from '../task-actions-menu/task-actions-menu';

/** Cosa può passare chi apre la modale (secondo argomento di dialog.open). */
export interface TasksDialogData {
  initialFilter?: TaskListFilter;
}

/**
 * La finestra con TUTTI i task: da fare, scaduti, fatti.
 * Non riceve i task da chi la apre: li legge dal servizio Tasks, lo stesso del pannello.
 * Così, quando modifichi qualcosa qui, anche il pannello dietro si aggiorna da solo.
 */
@Component({
  selector: 'app-tasks-dialog',
  imports: [
    DatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    DueLabelPipe,
    Overdue,
    PriorityDot,
    TaskActionsMenu,
  ],
  templateUrl: './tasks-dialog.html',
  styleUrl: './tasks-dialog.scss',
})
export class TasksDialog {
  // MAT_DIALOG_DATA è un InjectionToken (come il nostro API_BASE_URL): Material ci mette dentro
  // l'oggetto "data" passato a dialog.open(...). È il modo standard per dare dati a una modale.
  private data = inject<TasksDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  protected tasks = inject(Tasks);
  protected dialogs = inject(TaskDialogs);
  protected clock = inject(Clock);
  protected errorMessage = signal<string | null>(null);

  // il filtro scelto: parte da quello chiesto da chi ha aperto la modale, altrimenti "Da fare"
  protected filter = signal<TaskListFilter>(this.data?.initialFilter ?? 'open');

  private todayKey = computed(() => toDateKey(this.clock.now()));

  // Una lista per filtro. Separate perché servono due volte: per la lista E per i numeri sui bottoni.
  protected overdue = computed(() => this.tasks.tasks().filter((t) => isOverdue(t, this.todayKey())));
  protected open = computed(() =>
    this.tasks.tasks().filter((t) => t.completedAt === null && !isOverdue(t, this.todayKey())),
  );
  protected done = computed(() => this.tasks.tasks().filter((t) => t.completedAt !== null));

  // quella da mostrare. Lo switch copre tutti i valori di TaskListFilter: TypeScript lo sa e non vuole un default.
  protected visible = computed(() => {
    switch (this.filter()) {
      case 'open':
        return this.open();
      case 'overdue':
        return this.overdue();
      case 'done':
        return this.done();
      case 'all':
        return this.tasks.tasks();
    }
  });

  // --- Selezione multipla ---
  // In modalità selezione la checkbox di ogni riga NON segna più "fatto", ma "selezionato".

  protected selecting = signal(false);
  /** Gli id selezionati. Un Set nuovo a ogni modifica: così il signal "vede" il cambiamento. */
  protected selectedIds = signal<ReadonlySet<number>>(new Set());
  protected deleting = signal(false);

  /** Quanti dei task VISIBILI sono selezionati (cambiando filtro, quelli nascosti non contano). */
  protected selectedVisible = computed(() => this.visible().filter((t) => this.selectedIds().has(t.id)));
  protected allVisibleSelected = computed(
    () => this.visible().length > 0 && this.selectedVisible().length === this.visible().length,
  );

  protected startSelecting(): void {
    this.selectedIds.set(new Set());
    this.selecting.set(true);
  }

  protected stopSelecting(): void {
    this.selecting.set(false);
    this.selectedIds.set(new Set());
  }

  protected toggleSelected(task: Task): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
      }
      return next;
    });
  }

  /** "Seleziona tutti" / "Deseleziona tutti" sui task visibili col filtro attuale. */
  protected toggleAllVisible(): void {
    this.selectedIds.set(this.allVisibleSelected() ? new Set() : new Set(this.visible().map((t) => t.id)));
  }

  protected deleteSelected(): void {
    this.deleteTasks(this.selectedVisible().map((t) => t.id));
  }

  /** La scorciatoia del filtro "Fatti". */
  protected deleteAllDone(): void {
    this.deleteTasks(this.done().map((t) => t.id));
  }

  private deleteTasks(ids: number[]): void {
    if (ids.length === 0) {
      return;
    }
    const what = ids.length === 1 ? 'il task selezionato' : `${ids.length} task`;
    if (!confirm(`Eliminare ${what}? Non si può annullare.`)) {
      return;
    }
    this.deleting.set(true);
    this.errorMessage.set(null);
    this.tasks.removeMany(ids).subscribe({
      next: () => {
        this.deleting.set(false);
        this.stopSelecting();
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set('Alcuni task non sono stati eliminati, riprova');
      },
    });
  }

  protected toggle(task: Task): void {
    this.errorMessage.set(null);
    this.tasks.update(task.id, { completed: task.completedAt === null }).subscribe({
      error: () => this.errorMessage.set('Non sono riuscito a salvare, riprova'),
    });
  }
}
