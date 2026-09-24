import { isPlatformBrowser, LowerCasePipe, NgFor, UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Eroe } from '../eroe';
import { Eroeservizio } from '../servizi/eroeservizio';
import { Notificheservizio } from '../servizi/notificheservizio';


@Component({
  selector: 'app-eroi',
  imports: [UpperCasePipe, LowerCasePipe, NgFor, RouterLink],
  templateUrl: './eroi.html',
  styleUrl: './eroi.scss',
})

export class Eroi implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private richiesta?: Subscription;

  eroeSelezionato: Eroe | undefined;
  eroi: Eroe[] = [];
  caricamento = true;
  errore = '';

  constructor(
    private eroeservizio: Eroeservizio,
    private notificheservizio: Notificheservizio,
  ) {
    console.log('generato EROI');
  }

  ngOnInit(): void {
    /*if (!isPlatformBrowser(this.platformId)) {//per fare qst chiamata solo lato browser non quando avviane il primo caricamento (che è server-side)
      return;
    }*/

    this.richiesta = this.eroeservizio.getEroi().subscribe({
      next: (eroi) => {
        this.eroi = eroi;
        this.caricamento = false;
      },
      error: () => {
        this.errore = 'Non riesco a caricare gli eroi.';
        this.caricamento = false;
      },
    });
  }

  onSelect(eroe: Eroe): void {
    console.log('selezionato eroe', eroe);
    this.eroeSelezionato = eroe;
    this.notificheservizio.addNotifiche(`Selezionato ${eroe.nome}`);
  }

  ngOnDestroy(): void {
    this.richiesta?.unsubscribe();
  }
}
