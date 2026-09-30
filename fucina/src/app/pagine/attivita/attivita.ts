import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttivitaStore } from '../../core/attivita.store';
import { Priorita } from '../../core/modelli';
import { RigaAttivita } from '../../shared/riga-attivita';

@Component({
  selector: 'app-attivita',
  imports: [FormsModule, RouterLink, RigaAttivita],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attivita.html',
})
export class AttivitaPagina {
  protected readonly store = inject(AttivitaStore);
  /**
   * withComponentInputBinding copia il query param ?stato= nel signal input.
   * linkedSignal si azzera quando `stato` cambia, ma resta scrivibile.
   */
  protected readonly stato = input('tutte');
  protected readonly testo = linkedSignal({
    source: this.stato,
    computation: () => '',
  });
  protected readonly bozza = signal('');
  protected readonly prioritaBozza = signal<Priorita>('media');

  protected readonly visibili = computed(() => {
    const stato = this.stato();
    const q = this.testo().trim().toLowerCase();
    return this.store.elenco().filter((voce) => {
      const perStato =
        stato === 'fatte' ? voce.fatta : stato === 'aperte' ? !voce.fatta : true;
      const perTesto = !q || voce.titolo.toLowerCase().includes(q);
      return perStato && perTesto;
    });
  });

  aggiungi(): void {
    this.store.aggiungi(this.bozza(), this.prioritaBozza());
    this.bozza.set('');
  }
}
