import { isPlatformBrowser, LowerCasePipe, NgFor, UpperCasePipe } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { DettagliEroe } from '../dettagli-eroe/dettagli-eroe';
import { Eroe } from '../eroe';
import { Eroeservizio } from '../eroeservizio';


@Component({
  selector: 'app-eroi',
  imports: [UpperCasePipe, LowerCasePipe, NgFor, DettagliEroe],
  templateUrl: './eroi.html',
  styleUrl: './eroi.scss',
})

export class Eroi implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  eroeSelezionato: Eroe | undefined;
  eroi: Eroe[] = [];
  caricamento = true;
  errore = '';

  constructor(private eroeservizio: Eroeservizio) {
    console.log('generato EROI');
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.eroeservizio.getEroi().subscribe({
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
  }
}
