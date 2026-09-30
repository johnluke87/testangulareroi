import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConBozza } from '../../core/guardie';
import { nuovoId } from '../../core/modelli';
import { NoteStore } from '../../core/note.store';
import { Notifiche } from '../../core/notifiche';
import { Autofocus } from '../../shared/autofocus';

@Component({
  selector: 'app-editor-nota',
  imports: [ReactiveFormsModule, RouterLink, Autofocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-nota.html',
})
export class EditorNota implements ConBozza {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(NoteStore);
  private readonly router = inject(Router);
  private readonly notifiche = inject(Notifiche);

  /** Il segmento :id della route diventa questo input grazie a withComponentInputBinding. */
  protected readonly id = input.required<string>();

  protected readonly form = this.fb.nonNullable.group({
    titolo: ['', [Validators.required, Validators.minLength(3)]],
    corpo: [''],
    etichette: this.fb.nonNullable.array(['']),
  });

  constructor() {
    effect(() => {
      const id = this.id();
      const nota = id === 'nuova' ? undefined : this.store.trova(id);
      untracked(() => {
        this.form.controls.etichette.clear();
        const etichette = nota?.etichette.length ? nota.etichette : [''];
        for (const etichetta of etichette) {
          this.form.controls.etichette.push(this.fb.nonNullable.control(etichetta));
        }
        this.form.patchValue({ titolo: nota?.titolo ?? '', corpo: nota?.corpo ?? '' });
        this.form.markAsPristine();
      });
    });
  }

  manca(): boolean {
    return this.id() !== 'nuova' && !this.store.trova(this.id());
  }

  haModifiche(): boolean {
    return this.form.dirty;
  }

  aggiungiEtichetta(): void {
    this.form.controls.etichette.push(this.fb.nonNullable.control(''));
    this.form.markAsDirty();
  }

  rimuoviEtichetta(indice: number): void {
    this.form.controls.etichette.removeAt(indice);
    this.form.markAsDirty();
  }

  salva(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valore = this.form.getRawValue();
    const id = this.id() === 'nuova' ? nuovoId() : this.id();
    this.store.salva({
      id,
      titolo: valore.titolo.trim(),
      corpo: valore.corpo,
      etichette: valore.etichette.map((etichetta) => etichetta.trim()).filter(Boolean),
      aggiornataIl: new Date().toISOString(),
    });
    this.form.markAsPristine();
    this.notifiche.avvisa('Nota salvata');

    if (this.id() === 'nuova') {
      void this.router.navigate(['/note', id], { replaceUrl: true });
    }
  }

  elimina(): void {
    if (this.id() === 'nuova') {
      void this.router.navigate(['/note']);
      return;
    }

    this.form.markAsPristine();
    this.store.rimuovi(this.id());
    this.notifiche.avvisa('Nota eliminata');
    void this.router.navigate(['/note']);
  }
}
