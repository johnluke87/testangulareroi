import { Injectable, computed, effect, signal } from '@angular/core';
import { caricaJson, salvaJson } from './archivio';
import { Attivita, Priorita, nuovoId } from './modelli';

const CHIAVE = 'fucina.attivita';

const SEME: Attivita[] = [
  {
    id: 'a1',
    titolo: 'Aprire il banco di prova',
    priorita: 'alta',
    fatta: false,
    creataIl: '2026-09-24T08:00:00.000Z',
  },
  {
    id: 'a2',
    titolo: 'Salvare una nota con le etichette',
    priorita: 'media',
    fatta: false,
    creataIl: '2026-09-24T08:05:00.000Z',
  },
  {
    id: 'a3',
    titolo: 'Fare un pomodoro da 25 minuti',
    priorita: 'bassa',
    fatta: true,
    creataIl: '2026-09-23T18:00:00.000Z',
  },
];

/**
 * Store con signal. `effect` riscrive localStorage ogni volta che `voci` cambia.
 * providedIn: 'root' = una sola istanza, creata la prima volta che qualcuno la inietta.
 */
@Injectable({ providedIn: 'root' })
export class AttivitaStore {
  private readonly voci = signal<Attivita[]>(caricaJson(CHIAVE, () => SEME));
  readonly elenco = this.voci.asReadonly();
  readonly aperte = computed(() => this.voci().filter((voce) => !voce.fatta).length);
  readonly fatte = computed(() => this.voci().filter((voce) => voce.fatta).length);

  constructor() {
    effect(() => salvaJson(CHIAVE, this.voci()));
  }

  aggiungi(titolo: string, priorita: Priorita): void {
    const testo = titolo.trim();
    if (!testo) {
      return;
    }

    this.voci.update((voci) => [
      { id: nuovoId(), titolo: testo, priorita, fatta: false, creataIl: new Date().toISOString() },
      ...voci,
    ]);
  }

  alterna(id: string): void {
    this.voci.update((voci) =>
      voci.map((voce) => (voce.id === id ? { ...voce, fatta: !voce.fatta } : voce)),
    );
  }

  rimuovi(id: string): void {
    this.voci.update((voci) => voci.filter((voce) => voce.id !== id));
  }
}
