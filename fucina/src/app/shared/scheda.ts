import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Proiezione: chi usa la scheda decide il contenuto, la scheda decide la cornice. */
@Component({
  selector: 'app-scheda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="scheda">
      <header>
        <ng-content select="[intestazione]" />
      </header>
      <div class="corpo">
        <ng-content />
      </div>
      <footer>
        <ng-content select="[azioni]" />
      </footer>
    </article>
  `,
})
export class Scheda {}
