import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { Notificheservizio } from '../servizi/notificheservizio';

@Component({
  selector: 'app-notifiche',
  imports: [NgFor],
  templateUrl: './notifiche.html',
  styleUrl: './notifiche.scss',
})
export class Notifiche {
  constructor(readonly notificheservizio: Notificheservizio) {
  }

  deleteNotifiche(notifica: string): void {
    const index = this.notificheservizio.notifiche().indexOf(notifica);
    if (index < 0) {
      return;
    }
    this.notificheservizio.deleteNotifiche(index);
  }

  deleteAllNotifiche(): void {
    this.notificheservizio.deleteAllNotifiche();
  }
}
