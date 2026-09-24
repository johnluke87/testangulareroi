import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Notificheservizio {
  private readonly elenco = signal<string[]>([]);
  readonly notifiche = this.elenco.asReadonly();

  addNotifiche(notifica: string): void {
    this.elenco.update((lista) => [...lista, notifica]);
  }

  deleteNotifiche(index: number): void {
    this.elenco.update((lista) => lista.filter((_, i) => i !== index));
  }

  deleteAllNotifiche(): void {
    this.elenco.set([]);
  }
}
