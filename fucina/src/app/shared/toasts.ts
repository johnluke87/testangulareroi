import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Notifiche } from '../core/notifiche';

@Component({
  selector: 'app-toasts',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of notifiche.coda(); track toast.id) {
        <button type="button" class="toast" (click)="notifiche.chiudi(toast.id)">
          {{ toast.testo }}
        </button>
      }
    </div>
    <p class="ultimo-evento">Ultimo evento RxJS: {{ notifiche.flusso$ | async }}</p>
  `,
})
export class Toasts {
  protected readonly notifiche = inject(Notifiche);
}
