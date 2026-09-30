import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Priorita } from '../core/modelli';

@Component({
  selector: 'app-riga-attivita',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="riga" [class.fatta]="fatta()">
      <label>
        <input type="checkbox" [checked]="fatta()" (change)="toggle.emit()" />
        <span>{{ titolo() }}</span>
      </label>
      @switch (priorita()) {
        @case ('alta') {
          <span class="pillola alta">alta</span>
        }
        @case ('media') {
          <span class="pillola media">media</span>
        }
        @default {
          <span class="pillola bassa">bassa</span>
        }
      }
      <button type="button" class="testo" (click)="elimina.emit()">Elimina</button>
    </article>
  `,
})
export class RigaAttivita {
  readonly titolo = input.required<string>();
  readonly priorita = input.required<Priorita>();
  readonly fatta = input.required<boolean>();
  readonly toggle = output<void>();
  readonly elimina = output<void>();
}
