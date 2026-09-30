import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-blocco-pesante',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <h3>Chunk arrivato</h3>
      <p>
        Questo componente stava in un file separato ed è stato caricato solo adesso.
        &#64;defer serve per tenere leggera la prima pagina e scaricare il resto quando serve.
      </p>
    </article>
  `,
})
export class BloccoPesante {}
