import { LowerCasePipe, UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { Eroe } from '../eroe';
import { Eroeservizio } from '../servizi/eroeservizio';

@Component({
  selector: 'app-dettagli-eroe',
  imports: [UpperCasePipe, LowerCasePipe, FormsModule],
  templateUrl: './dettagli-eroe.html',
  styleUrl: './dettagli-eroe.scss',
})
export class DettagliEroe implements OnInit, OnDestroy {
  eroeSelezionato: Eroe | undefined;
  caricamento = true;
  errore = '';
  private richiesta?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private eroeservizio: Eroeservizio,
  ) {}

  ngOnInit(): void {
    this.richiesta = this.route.paramMap.pipe(
      switchMap((params) => this.eroeservizio.getEroe(Number(params.get('id')))),
    ).subscribe({
      next: (eroe) => {
        this.eroeSelezionato = eroe;
        this.caricamento = false;
        this.errore = eroe ? '' : 'Eroe non trovato.';
      },
      error: () => {
        this.caricamento = false;
        this.errore = 'Non riesco a caricare l\'eroe.';
      },
    });
  }

  ngOnDestroy(): void {
    this.richiesta?.unsubscribe();
  }
}
