import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServizioProva } from '../../servizio/servizio-prova';

@Component({
  selector: 'app-pagina0',
  imports: [NgFor, RouterLink],
  templateUrl: './pagina0.html',
  styleUrl: './pagina0.scss',
})
export class Pagina0 {
  persone: any[] = [];

  constructor(private servizioProva: ServizioProva) {}

  ngOnInit() {
    this.persone = this.servizioProva.getPersone();
  }
}
