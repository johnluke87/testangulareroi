import { Component, inject, signal } from '@angular/core';
import { Api } from '../core/api';
import { Opportunity } from '../core/models';
import { Card } from '../shared/card';

@Component({
  selector: 'app-salvati',
  imports: [Card],
  template: `
    <header class="hero"><h1>Salvati</h1></header>
    <div class="grid pad">
      @for (item of items(); track item.id) { <app-card [item]="item" /> }
      @if (!items().length) { <p>Ancora nessun posto salvato.</p> }
    </div>
  `,
})
export class Salvati {
  private api = inject(Api);
  items = signal<Opportunity[]>([]);
  constructor() { void this.api.saved().then((r) => this.items.set(r.items)); }
}
