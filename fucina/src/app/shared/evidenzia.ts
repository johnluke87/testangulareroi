import { Directive, input, signal } from '@angular/core';

/** Direttiva di attributo: arricchisce un elemento che esiste già, non ne crea uno nuovo. */
@Directive({
  selector: '[appEvidenzia]',
  host: {
    '(mouseenter)': 'acceso.set(true)',
    '(mouseleave)': 'acceso.set(false)',
    '[style.background]': 'acceso() ? colore() : null',
    '[style.borderRadius]': 'acceso() ? "10px" : null',
    '[style.padding]': 'acceso() ? "0.15rem 0.4rem" : null',
  },
})
export class Evidenzia {
  readonly colore = input('rgba(216, 106, 42, 0.28)');
  protected readonly acceso = signal(false);
}
