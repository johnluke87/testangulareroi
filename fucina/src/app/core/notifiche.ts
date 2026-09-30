import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { nuovoId } from './modelli';

export interface Toast {
  id: string;
  testo: string;
}

/**
 * Due canali per lo stesso evento, apposta per confrontarli:
 * - `coda` è un signal (il template della shell lo legge in modo diretto)
 * - `flusso$` è un Observable (il template lo legge con la pipe async)
 */
@Injectable({ providedIn: 'root' })
export class Notifiche {
  private readonly _coda = signal<Toast[]>([]);
  readonly coda = this._coda.asReadonly();
  private readonly subject = new Subject<string>();
  readonly flusso$ = this.subject.asObservable();

  avvisa(testo: string): void {
    const id = nuovoId();
    this._coda.update((coda) => [...coda, { id, testo }]);
    this.subject.next(testo);
    setTimeout(() => this.chiudi(id), 3200);
  }

  chiudi(id: string): void {
    this._coda.update((coda) => coda.filter((toast) => toast.id !== id));
  }
}
