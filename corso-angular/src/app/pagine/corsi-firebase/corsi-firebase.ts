import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Corso, CorsiFirebase, DatiCorso } from '../../servizi/corsi-firebase';
import { RegistroHttp } from '../../servizi/registro-http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-corsi-firebase',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './corsi-firebase.html',
  styleUrl: './corsi-firebase.scss',
})
export class CorsiFirebasePagina implements OnInit {
  private api = inject(CorsiFirebase);
  private destroyRef = inject(DestroyRef);
  protected registro = inject(RegistroHttp);

  firebaseUrl = environment.firebaseUrl;

  corsi = signal<Corso[]>([]);
  caricamento = signal(false);
  salvataggio = signal(false);
  errore = signal('');
  inModifica = signal<string | null>(null); // id del corso in modifica, null = nuovo

  corsiOrdinati = computed(() =>
    [...this.corsi()].sort((a, b) => a.titolo.localeCompare(b.titolo)),
  );
  oreTotali = computed(() => this.corsi().reduce((tot, c) => tot + c.ore, 0));

  form = new FormGroup({
    titolo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    docente: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ore: new FormControl(8, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(200)],
    }),
    attivo: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit() {
    this.carica();
  }

  // GET
  carica() {
    this.caricamento.set(true);
    this.errore.set('');
    this.api
      .lista()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (corsi) => {
          this.corsi.set(corsi);
          this.caricamento.set(false);
        },
        error: (e: Error) => {
          this.errore.set(e.message);
          this.caricamento.set(false);
        },
      });
  }

  // POST (nuovo) oppure PUT (modifica)
  salva() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dati: DatiCorso = this.form.getRawValue();
    const id = this.inModifica();
    const richiesta = id ? this.api.sostituisci({ id, ...dati }) : this.api.crea(dati);

    this.salvataggio.set(true);
    this.errore.set('');
    richiesta.subscribe({
      next: (salvato) => {
        this.corsi.update((lista) =>
          id ? lista.map((c) => (c.id === id ? salvato : c)) : [...lista, salvato],
        );
        this.annulla();
        this.salvataggio.set(false);
      },
      error: (e: Error) => {
        this.errore.set(e.message);
        this.salvataggio.set(false);
      },
    });
  }

  modifica(corso: Corso) {
    this.inModifica.set(corso.id);
    this.form.setValue({
      titolo: corso.titolo,
      docente: corso.docente,
      ore: corso.ore,
      attivo: corso.attivo,
    });
  }

  annulla() {
    this.inModifica.set(null);
    this.form.reset();
  }

  // PATCH: invia solo il campo che cambia
  cambiaAttivo(corso: Corso) {
    const attivo = !corso.attivo;
    this.api.aggiorna(corso.id, { attivo }).subscribe({
      next: () =>
        this.corsi.update((lista) => lista.map((c) => (c.id === corso.id ? { ...c, attivo } : c))),
      error: (e: Error) => this.errore.set(e.message),
    });
  }

  // DELETE
  elimina(corso: Corso) {
    if (!confirm(`Eliminare "${corso.titolo}"?`)) return;
    this.api.elimina(corso.id).subscribe({
      next: () => {
        this.corsi.update((lista) => lista.filter((c) => c.id !== corso.id));
        if (this.inModifica() === corso.id) this.annulla();
      },
      error: (e: Error) => this.errore.set(e.message),
    });
  }
}
