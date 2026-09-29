import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

interface Corso {
  id: number;
  titolo: string;
  ore: number;
}

interface Promemoria {
  id: number;
  testo: string;
  priorita: 'bassa' | 'alta';
  fatto: boolean;
}

@Component({
  selector: 'app-esempi-ngmodel',
  imports: [FormsModule, JsonPipe],
  templateUrl: './esempi-ngmodel.html',
  styleUrl: './esempi-ngmodel.scss',
})
export class EsempiNgmodel {
  // 1. [(ngModel)] su una proprietà normale
  nome = 'Mario';

  // 2. [(ngModel)] su un signal: si passa il signal senza parentesi
  citta = signal('Roma');
  lettereCitta = computed(() => this.citta().length);

  // 3. [ngModel] + (ngModelChange): il valore passa da un metodo prima di essere salvato
  codice = '';
  cambiCodice = 0;
  aggiornaCodice(valore: string) {
    this.codice = valore.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.cambiCodice++;
  }

  // 4. Due campi legati alla stessa proprietà
  volume = 30;

  // 5. Checkbox: un booleano, e una lista di scelte multiple
  newsletter = false;
  interessiDisponibili = ['Angular', 'TypeScript', 'RxJS', 'CSS'];
  interessi: string[] = ['Angular'];
  scelto(voce: string) {
    return this.interessi.includes(voce);
  }
  cambiaInteresse(voce: string, attivo: boolean) {
    this.interessi = attivo
      ? [...this.interessi, voce]
      : this.interessi.filter((i) => i !== voce);
  }

  // 6. Select con oggetti: [ngValue] e compareWith
  corsi: Corso[] = [
    { id: 1, titolo: 'Angular base', ore: 16 },
    { id: 2, titolo: 'Angular avanzato', ore: 24 },
    { id: 3, titolo: 'RxJS', ore: 8 },
  ];
  // Arriva "dal server": è un oggetto diverso da corsi[1], anche se ha lo stesso id
  corsoScelto: Corso | null = { id: 2, titolo: 'Angular avanzato', ore: 24 };
  stessoCorso = (a: Corso | null, b: Corso | null) => a?.id === b?.id;

  // 7. Radio
  taglia: 'S' | 'M' | 'L' = 'M';

  // 8. updateOn: 'blur'
  cognome = '';

  // 9. Form con ngModel senza binding: i valori si leggono da f.value
  promemoria = signal<Promemoria[]>([
    { id: 1, testo: 'Ripassare il routing', priorita: 'alta', fatto: true },
    { id: 2, testo: 'Provare i form template-driven', priorita: 'bassa', fatto: false },
  ]);
  daFare = computed(() => this.promemoria().filter((p) => !p.fatto).length);
  private prossimoId = 3;

  aggiungi(f: NgForm) {
    if (f.invalid) return;
    const { testo, priorita } = f.value as { testo: string; priorita: 'bassa' | 'alta' };
    this.promemoria.update((lista) => [
      ...lista,
      { id: this.prossimoId++, testo: testo.trim(), priorita, fatto: false },
    ]);
    f.resetForm({ testo: '', priorita: 'bassa' });
  }

  segnaFatto(id: number, fatto: boolean) {
    this.promemoria.update((lista) => lista.map((p) => (p.id === id ? { ...p, fatto } : p)));
  }

  elimina(id: number) {
    this.promemoria.update((lista) => lista.filter((p) => p.id !== id));
  }
}
