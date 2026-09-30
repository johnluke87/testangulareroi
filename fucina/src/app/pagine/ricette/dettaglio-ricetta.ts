import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_RICETTE } from '../../core/api-ricette';
import { Ricetta } from '../../core/modelli';

@Component({
  selector: 'app-dettaglio-ricetta',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dettaglio-ricetta.html',
})
export class DettaglioRicetta {
  private readonly api = inject(API_RICETTE);
  protected readonly id = input.required<string>();
  protected readonly ricetta = httpResource<Ricetta>(() => `${this.api}/recipes/${this.id()}`);

  messaggio(errore: unknown): string {
    return errore instanceof Error ? errore.message : 'Richiesta non riuscita';
  }
}
