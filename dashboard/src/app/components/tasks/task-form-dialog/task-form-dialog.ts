import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Clock } from '../../../core/services/clock';
import { Tasks } from '../../../core/services/tasks';
import {
  NewTask,
  Task,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_SLOT_LABELS,
  TASK_SLOTS,
  TaskPriority,
  TaskSlot,
} from '../../../models/task';
import { addDays, fromDateKey, toDateKey } from '../../../shared/dates';

// Stessi limiti del PHP (tasks.php): meglio avvisare subito che farsi rispondere 400 dal server.
const TITLE_MAX = 200;
const NOTES_MAX = 5000;

/** Validatore personalizzato: Validators.required accetta "   " (solo spazi), questo no. */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() === '' ? { blank: true } : null;
}

/** Senza task = nuovo; con task = modifica di quel task. */
export interface TaskFormDialogData {
  task?: Task;
}

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  // Il datepicker ha bisogno di un "adattatore" che gli dica come sono fatte le date (qui: le Date di JavaScript).
  // Lo fornisco SOLO a questo componente, non a tutta l'app: così il suo codice resta nel pezzo
  // caricato in lazy insieme al form. La lingua (lunedì primo giorno, mesi in italiano) arriva da LOCALE_ID.
  providers: [provideNativeDateAdapter()],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
})
export class TaskFormDialog {
  private data = inject<TaskFormDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  // il riferimento alla finestra aperta: serve per chiuderla da codice (dialogRef.close(risultato))
  private dialogRef = inject<MatDialogRef<TaskFormDialog, Task>>(MatDialogRef);
  private tasks = inject(Tasks);
  private clock = inject(Clock);
  private fb = inject(NonNullableFormBuilder);

  /** Il task che stai modificando, oppure undefined se ne stai creando uno nuovo. */
  protected editing = this.data?.task;

  // liste ed etichette per il template (il template vede solo i membri della classe)
  protected priorities = TASK_PRIORITIES;
  protected priorityLabels = TASK_PRIORITY_LABELS;
  protected slots = TASK_SLOTS;
  protected slotLabels = TASK_SLOT_LABELS;
  protected titleMax = TITLE_MAX;

  protected saving = signal(false);
  protected errorMessage = signal<string | null>(null);

  // Il form, già compilato se stai modificando. fb.control<Tipo>(...) dice a TypeScript cosa conterrà
  // ogni campo (es. Date | null), così getRawValue() più sotto è tipizzato bene.
  protected form = this.fb.group({
    title: this.fb.control(this.editing?.title ?? '', [notBlank, Validators.maxLength(TITLE_MAX)]),
    notes: this.fb.control(this.editing?.notes ?? '', Validators.maxLength(NOTES_MAX)),
    priority: this.fb.control<TaskPriority>(this.editing?.priority ?? 2),
    // il datepicker lavora con oggetti Date; nel database c'è la stringa 'YYYY-MM-DD'
    dueDate: this.fb.control<Date | null>(this.editing?.dueDate ? fromDateKey(this.editing.dueDate) : null),
    // il momento della giornata parte disabilitato se non c'è una data
    dueSlot: this.fb.control<TaskSlot | null>({
      value: this.editing?.dueSlot ?? null,
      disabled: !this.editing?.dueDate,
    }),
  });

  constructor() {
    // "Mattina/pomeriggio/sera" senza una data non ha senso (il PHP lo rifiuterebbe):
    // quando la data cambia, abilito o svuoto e disabilito il campo del momento.
    // takeUntilDestroyed: smette di ascoltare da solo quando la finestra si chiude (niente "memory leak").
    this.form.controls.dueDate.valueChanges.pipe(takeUntilDestroyed()).subscribe((date) => {
      const slot = this.form.controls.dueSlot;
      if (date) {
        slot.enable();
      } else {
        slot.setValue(null);
        slot.disable();
      }
    });
  }

  /** I bottoni rapidi "Oggi" / "Domani": imposto la data a oggi + N giorni. */
  protected setDueInDays(days: number): void {
    this.form.controls.dueDate.setValue(fromDateKey(addDays(toDateKey(this.clock.now()), days)));
  }

  protected clearDueDate(): void {
    this.form.controls.dueDate.setValue(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // mostra subito gli errori sotto i campi
      return;
    }

    // getRawValue include anche i campi disabilitati (value invece li salterebbe)
    const value = this.form.getRawValue();
    const task: NewTask = {
      title: value.title.trim(),
      notes: value.notes.trim() || null, // note vuote = null nel database
      priority: value.priority,
      dueDate: value.dueDate ? toDateKey(value.dueDate) : null,
      dueSlot: value.dueDate ? value.dueSlot : null,
    };

    this.saving.set(true);
    this.errorMessage.set(null);

    // stessa forma per i due casi: un Observable che, se va bene, restituisce il task salvato
    const request = this.editing ? this.tasks.update(this.editing.id, task) : this.tasks.create(task);

    request.subscribe({
      // chiudo la finestra SOLO dopo che il server ha confermato; il task salvato torna a chi l'ha aperta
      next: (saved) => this.dialogRef.close(saved),
      error: (error: HttpErrorResponse) => {
        // i messaggi del PHP sono pensati per essere mostrati ("Il titolo è obbligatorio...")
        this.errorMessage.set(error.error?.error ?? 'Salvataggio non riuscito, riprova');
        this.saving.set(false);
      },
    });
  }
}
