import { Injectable, computed, effect, signal } from '@angular/core';
import { caricaJson, salvaJson } from './archivio';
import { Nota } from './modelli';

const CHIAVE = 'fucina.note';

const SEME: Nota[] = [
  {
    id: 'benvenuto',
    titolo: 'Benvenuto in Fucina',
    corpo: 'Questa nota vive nel localStorage del browser.\n\nIl banco di prova mostra direttive, pipe, @defer, proiezione, injector e ciclo di vita.',
    etichette: ['angular', 'partenza'],
    aggiornataIl: '2026-09-24T09:00:00.000Z',
  },
];

@Injectable({ providedIn: 'root' })
export class NoteStore {
  private readonly voci = signal<Nota[]>(caricaJson(CHIAVE, () => SEME));
  readonly elenco = computed(() =>
    [...this.voci()].sort((a, b) => b.aggiornataIl.localeCompare(a.aggiornataIl)),
  );

  constructor() {
    effect(() => salvaJson(CHIAVE, this.voci()));
  }

  trova(id: string): Nota | undefined {
    return this.voci().find((nota) => nota.id === id);
  }

  salva(nota: Nota): void {
    this.voci.update((voci) => {
      const indice = voci.findIndex((voce) => voce.id === nota.id);
      if (indice === -1) {
        return [nota, ...voci];
      }
      return voci.map((voce) => (voce.id === nota.id ? nota : voce));
    });
  }

  rimuovi(id: string): void {
    this.voci.update((voci) => voci.filter((nota) => nota.id !== id));
  }
}
