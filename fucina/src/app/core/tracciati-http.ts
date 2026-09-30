import { Injectable, signal } from '@angular/core';
import { TracciaHttp } from './modelli';

@Injectable({ providedIn: 'root' })
export class TracciatiHttp {
  private readonly _elenco = signal<TracciaHttp[]>([]);
  readonly elenco = this._elenco.asReadonly();

  registra(url: string, ms: number, ok: boolean): void {
    this._elenco.update((voci) => [{ url, ms: Math.round(ms), ok }, ...voci].slice(0, 5));
  }
}
