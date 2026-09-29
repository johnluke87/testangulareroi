import { AfterViewInit, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { EmailLibera, PasswordUguali, ValoreVietato } from './validatori';

export interface DatiIscrizione {
  nome: string;
  email: string;
  eta: number | null;
  credenziali: { password: string; conferma: string };
  indirizzo: { citta: string; cap: string };
  livello: string;
  modalita: 'presenza' | 'online';
  note: string;
  privacy: boolean;
}

@Component({
  selector: 'app-iscrizione',
  imports: [FormsModule, JsonPipe, ValoreVietato, PasswordUguali, EmailLibera],
  templateUrl: './iscrizione.html',
  styleUrl: './iscrizione.scss',
})
export class Iscrizione implements AfterViewInit {
  private destroyRef = inject(DestroyRef);

  // 1. Riferimenti presi con viewChild: il form intero e un singolo campo.
  //    Il nome tra apici è quello scritto dopo # nel template.
  form = viewChild.required<NgForm>('iscrizioneForm');
  campoEmail = viewChild<NgModel>('email');

  livelli = ['Base', 'Intermedio', 'Avanzato'];

  // 2. Il modello: [(ngModel)] legge e scrive in queste proprietà.
  modello: DatiIscrizione = this.modelloVuoto();

  inviata = signal<DatiIscrizione | null>(null);
  modifiche = signal(0);

  // 3. Dopo che la vista esiste, il form è pronto: ci si può iscrivere ai cambi.
  ngAfterViewInit() {
    this.form()
      .valueChanges?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.modifiche.update((n) => n + 1));
  }

  // 4. Submit: arriva il form preso con #iscrizioneForm="ngForm".
  invia(f: NgForm) {
    if (f.invalid || f.pending) {
      f.control.markAllAsTouched(); // mostra subito tutti gli errori
      return;
    }
    // f.value ha la stessa forma dei name e dei ngModelGroup del template.
    this.inviata.set(structuredClone(this.modello));
  }

  // 5. In un form template-driven i valori si cambiano nel modello, non nel form:
  //    ngModel ricopia il modello nei campi. form.patchValue cambierebbe i campi
  //    ma non this.modello, e i due andrebbero fuori sincrono.
  precompila() {
    this.modello = {
      ...this.modello,
      nome: 'Luigi',
      email: 'luigi@esempio.it',
      eta: 30,
      indirizzo: { citta: 'Torino', cap: '10100' },
      livello: 'Intermedio',
    };
  }

  // 6. Il form preso con viewChild serve per ciò che riguarda gli stati:
  //    resetForm azzera touched, dirty e submitted e rimette nei campi i valori passati.
  //    Senza argomento i campi diventano null, e ngModel non riscrive i valori del modello
  //    rimasti uguali (per esempio il radio 'presenza'): per questo gli passiamo il modello vuoto.
  svuota() {
    const vuoto = this.modelloVuoto();
    this.form().resetForm(vuoto);
    this.modello = vuoto;
    this.inviata.set(null);
  }

  private modelloVuoto(): DatiIscrizione {
    return {
      nome: '',
      email: '',
      eta: null,
      credenziali: { password: '', conferma: '' },
      indirizzo: { citta: '', cap: '' },
      livello: '',
      modalita: 'presenza',
      note: '',
      privacy: false,
    };
  }
}
