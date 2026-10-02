import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
// "import type": prendo solo i TIPI. Spariscono dopo la compilazione, quindi non trascinano
// il codice delle modali nel bundle principale (che invece carico più sotto con import()).
import type { TaskFormDialogData } from '../../components/tasks/task-form-dialog/task-form-dialog';
import type { TasksDialogData } from '../../components/tasks/tasks-dialog/tasks-dialog';
import { Task, TaskListFilter } from '../../models/task';

/**
 * Apre le finestre dei task da qualsiasi punto dell'app (pannello, modale, menu delle azioni).
 * Centralizzare l'apertura qui evita di ripetere dimensioni e opzioni in tre componenti.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskDialogs {
  private dialog = inject(MatDialog);

  /** La finestra con tutti i task. */
  async openList(initialFilter: TaskListFilter = 'open'): Promise<void> {
    // import() dinamico = lazy loading: il codice della modale (con i suoi moduli Material)
    // si scarica dal server solo la prima volta che la apri. Le volte dopo è già in memoria.
    const { TasksDialog } = await import('../../components/tasks/tasks-dialog/tasks-dialog');

    this.dialog.open<InstanceType<typeof TasksDialog>, TasksDialogData>(TasksDialog, {
      data: { initialFilter },
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false, // niente bordo di focus sul primo bottone appena si apre
    });
  }

  /** Il form: senza task = nuovo, con un task = modifica. Restituisce il task salvato, o undefined se annulli. */
  async openForm(task?: Task): Promise<Task | undefined> {
    const { TaskFormDialog } = await import('../../components/tasks/task-form-dialog/task-form-dialog');

    const ref = this.dialog.open<InstanceType<typeof TaskFormDialog>, TaskFormDialogData, Task>(TaskFormDialog, {
      data: { task },
      width: '520px',
      maxWidth: '95vw',
    });
    // afterClosed() emette quello che la modale passa a dialogRef.close(...) quando si chiude;
    // firstValueFrom trasforma quell'Observable in una Promise, così chi chiama può fare "await".
    return firstValueFrom(ref.afterClosed());
  }
}
