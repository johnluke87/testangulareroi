import { Component, signal } from '@angular/core';
import { Highlight } from '../direttive/highlight';

@Component({
  selector: 'app-direttiva-esempio',
  imports: [Highlight],
  templateUrl: './direttiva-esempio.html',
})
export class DirettivaEsempio {
  colore = signal('');

  cambiaColoreEvidenziatore(colore: string) {
    this.colore.set(colore);
  }
}
