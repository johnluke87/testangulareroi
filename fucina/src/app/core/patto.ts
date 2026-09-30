import { Injectable, signal } from '@angular/core';

const CHIAVE = 'fucina.patto';

/** Stato piccolo, letto dalla guardia canActivate del banco di prova. */
@Injectable({ providedIn: 'root' })
export class Patto {
  readonly accettato = signal(
    typeof localStorage !== 'undefined' && localStorage.getItem(CHIAVE) === 'si',
  );

  accetta(): void {
    localStorage.setItem(CHIAVE, 'si');
    this.accettato.set(true);
  }

  dimentica(): void {
    localStorage.removeItem(CHIAVE);
    this.accettato.set(false);
  }
}
