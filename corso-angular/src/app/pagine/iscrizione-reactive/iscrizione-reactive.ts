import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { emailLibera, passwordUguali, valoreVietato } from './validatori-reactive';

const CORSI = ['Angular base', 'Angular avanzato', 'RxJS', 'TypeScript', 'Signal e zoneless'];

function nuovoTelefono() {
  return new FormControl('', {
    nonNullable: true,
    validators: [Validators.pattern(/^\+?\d{6,15}$/)],
  });
}

@Component({
  selector: 'app-iscrizione-reactive',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './iscrizione-reactive.html',
  styleUrl: './iscrizione-reactive.scss',
})
export class IscrizioneReactive {
  livelli = ['Base', 'Intermedio', 'Avanzato'];

  // 1. Il form si costruisce nella classe: un FormGroup che contiene FormControl,
  //    altri FormGroup (oggetti annidati) e FormArray (liste di lunghezza variabile).
  //    nonNullable: true fa sì che reset() riporti al valore iniziale e non a null.
  form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        valoreVietato('admin'),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
      asyncValidators: [emailLibera()],
      updateOn: 'blur',
    }),
    eta: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(18),
      Validators.max(99),
    ]),
    credenziali: new FormGroup(
      {
        password: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.minLength(6)],
        }),
        conferma: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      },
      { validators: passwordUguali },
    ),
    indirizzo: new FormGroup({
      citta: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      cap: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{5}$/)],
      }),
    }),
    livello: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modalita: new FormControl<'presenza' | 'online'>('presenza', { nonNullable: true }),
    fattura: new FormControl<'privato' | 'azienda'>('privato', { nonNullable: true }),
    // Parte disabilitata: non viene validata e non compare in form.value.
    azienda: new FormControl(
      { value: '', disabled: true },
      { nonNullable: true, validators: [Validators.required] },
    ),
    telefoni: new FormArray([nuovoTelefono()]),
    note: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    privacy: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  // 2. Scorciatoie per il template: invece di form.controls.nome si scrive nome.
  get nome() {
    return this.form.controls.nome;
  }
  get email() {
    return this.form.controls.email;
  }
  get telefoni() {
    return this.form.controls.telefoni;
  }

  // 3. Un FormControl anche fuori da un form: campo di ricerca con [formControl].
  ricerca = new FormControl('', { nonNullable: true });
  corsiTrovati = toSignal(
    this.ricerca.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map((testo) => CORSI.filter((c) => c.toLowerCase().includes(testo.toLowerCase()))),
    ),
    { initialValue: CORSI },
  );

  // 4. Lo stato del form come signal: statusChanges emette a ogni cambio di stato.
  stato = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  inviata = signal<{ nome: string; email: string; telefoni: string[] } | null>(null);

  constructor() {
    // 5. Reagire a un campo: il nome dell'azienda serve solo se la fattura è per un'azienda.
    //    takeUntilDestroyed() senza argomenti funziona qui perché siamo nel constructor.
    this.form.controls.fattura.valueChanges.pipe(takeUntilDestroyed()).subscribe((tipo) => {
      const azienda = this.form.controls.azienda;
      azienda.reset(); // valore vuoto, untouched: niente errore appena compare
      if (tipo === 'azienda') {
        azienda.enable();
      } else {
        azienda.disable();
      }
    });
  }

  // Regola unica per mostrare un errore: campo non valido e già toccato.
  // Al submit markAllAsTouched rende "toccati" tutti i campi.
  mostraErrore(control: AbstractControl) {
    return control.invalid && control.touched;
  }

  aggiungiTelefono() {
    this.telefoni.push(nuovoTelefono());
  }

  rimuoviTelefono(indice: number) {
    this.telefoni.removeAt(indice);
  }

  // 6. Submit: il form non viene passato come argomento, sta già nella classe.
  invia() {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }
    // value esclude i campi disabilitati; getRawValue li include.
    const dati = this.form.getRawValue();
    this.inviata.set({
      nome: dati.nome,
      email: dati.email,
      telefoni: dati.telefoni.filter((t) => t !== ''),
    });
  }

  // 7. Qui patchValue va benissimo: il form È la fonte dei dati, non c'è un modello separato.
  precompila() {
    this.form.patchValue({
      nome: 'Luigi',
      email: 'luigi@esempio.it',
      eta: 30,
      indirizzo: { citta: 'Torino', cap: '10100' },
      livello: 'Intermedio',
    });
  }

  svuota() {
    this.form.reset(); // valori iniziali, pristine, untouched
    this.telefoni.clear(); // reset non cambia il numero di elementi di un FormArray
    this.telefoni.push(nuovoTelefono());
    this.inviata.set(null);
  }
}
