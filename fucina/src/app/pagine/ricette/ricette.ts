import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { API_RICETTE } from '../../core/api-ricette';
import { RispostaRicette } from '../../core/modelli';
import { TracciatiHttp } from '../../core/tracciati-http';

@Component({
  selector: 'app-ricette',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ricette.html',
})
export class RicettePagina {
  private readonly api = inject(API_RICETTE);
  protected readonly tracciati = inject(TracciatiHttp);
  protected readonly ricerca = signal('');
  /** toObservable + debounce + toSignal: il resource parte solo quando la ricerca si ferma. */
  private readonly ricercaLenta = toSignal(
    toObservable(this.ricerca).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly ricette = httpResource<RispostaRicette>(() => {
    const q = this.ricercaLenta().trim();
    return q
      ? `${this.api}/recipes/search?q=${encodeURIComponent(q)}`
      : `${this.api}/recipes?limit=12`;
  });

  messaggio(errore: unknown): string {
    return errore instanceof Error ? errore.message : 'Richiesta non riuscita';
  }
}
