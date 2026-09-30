import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-non-trovata',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pagina">
      <h1>Pagina non trovata</h1>
      <p>La route <code>**</code> ha preso un indirizzo che non esiste.</p>
      <a routerLink="/bacheca">Torna in bacheca</a>
    </section>
  `,
})
export class NonTrovata {}
