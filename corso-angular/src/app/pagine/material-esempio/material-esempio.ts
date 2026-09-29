import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Troncato } from '../../pipes/troncato';

interface Lezione {
  id: number;
  titolo: string;
  livello: string;
  descrizione: string;
  fatta: boolean;
}

@Component({
  selector: 'app-material-esempio',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    Troncato,
  ],
  templateUrl: './material-esempio.html',
  styleUrl: './material-esempio.scss',
})
export class MaterialEsempio {
  private snackBar = inject(MatSnackBar);

  // La direttiva [formGroup] del template: sa se il form è stato inviato (submitted).
  // Material mostra mat-error anche quando submitted è true, e form.reset() non lo azzera.
  private direttivaForm = viewChild.required(FormGroupDirective);

  livelli = ['Base', 'Intermedio', 'Avanzato'];
  colonne = ['fatta', 'titolo', 'livello', 'descrizione', 'azioni'];

  lezioni = signal<Lezione[]>([
    { id: 1, titolo: 'Componenti', livello: 'Base', descrizione: 'Classe, template e stile: i tre file di ogni componente.', fatta: true },
    { id: 2, titolo: 'Routing', livello: 'Intermedio', descrizione: 'Rotte, parametri, guardie, lazy loading e resolver.', fatta: false },
  ]);
  fatte = computed(() => this.lezioni().filter((l) => l.fatta).length);
  private prossimoId = 3;

  form = new FormGroup({
    titolo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    livello: new FormControl('Base', { nonNullable: true, validators: [Validators.required] }),
    descrizione: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
  });

  aggiungi() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nuova: Lezione = { id: this.prossimoId++, fatta: false, ...this.form.getRawValue() };
    this.lezioni.update((l) => [...l, nuova]);
    this.svuota();
    this.snackBar.open(`Lezione "${nuova.titolo}" aggiunta`, 'OK', { duration: 3000 });
  }

  svuota() {
    this.direttivaForm().resetForm(); // valori iniziali + submitted false: niente errori rossi
  }

  segnaFatta(lezione: Lezione, fatta: boolean) {
    this.lezioni.update((l) => l.map((x) => (x.id === lezione.id ? { ...x, fatta } : x)));
  }

  elimina(lezione: Lezione) {
    this.lezioni.update((l) => l.filter((x) => x.id !== lezione.id));
    const avviso = this.snackBar.open(`Eliminata "${lezione.titolo}"`, 'Annulla', { duration: 5000 });
    avviso.onAction().subscribe(() => this.lezioni.update((l) => [...l, lezione]));
  }
}
