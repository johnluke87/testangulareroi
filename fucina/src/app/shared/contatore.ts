import { ChangeDetectionStrategy, Component, model } from '@angular/core';

/** model() è un input scrivibile: il genitore può fare [(valore)]="signal". */
@Component({
  selector: 'app-contatore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="riga-azioni">
      <button type="button" (click)="valore.update((n) => n - 1)">−</button>
      <strong>{{ valore() }}</strong>
      <button type="button" (click)="valore.update((n) => n + 1)">+</button>
    </div>
  `,
})
export class Contatore {
  readonly valore = model(0);
}
