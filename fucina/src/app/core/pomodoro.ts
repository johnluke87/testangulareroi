import { Injectable, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Notifiche } from './notifiche';

const FOCUS = 25 * 60;
const PAUSA = 5 * 60;

/** Timer RxJS. Resta vivo anche cambiando pagina, perché il service è singleton. */
@Injectable({ providedIn: 'root' })
export class Pomodoro {
  private readonly notifiche = inject(Notifiche);
  private abbonamento: Subscription | null = null;

  readonly fase = signal<'focus' | 'pausa'>('focus');
  readonly attivo = signal(false);
  readonly rimanenti = signal(FOCUS);

  avvia(): void {
    if (this.attivo()) {
      return;
    }

    this.attivo.set(true);
    this.abbonamento = interval(1000).subscribe(() => this.tic());
  }

  pausa(): void {
    this.attivo.set(false);
    this.abbonamento?.unsubscribe();
    this.abbonamento = null;
  }

  reset(): void {
    this.pausa();
    this.fase.set('focus');
    this.rimanenti.set(FOCUS);
  }

  salta(): void {
    this.faseSuccessiva(false);
  }

  private tic(): void {
    if (this.rimanenti() <= 1) {
      this.faseSuccessiva(true);
      return;
    }

    this.rimanenti.update((secondi) => secondi - 1);
  }

  private faseSuccessiva(avvisa: boolean): void {
    const prossima = this.fase() === 'focus' ? 'pausa' : 'focus';
    this.fase.set(prossima);
    this.rimanenti.set(prossima === 'focus' ? FOCUS : PAUSA);
    if (avvisa) {
      this.notifiche.avvisa(prossima === 'focus' ? 'Si torna al lavoro' : 'Pausa');
    }
  }
}
