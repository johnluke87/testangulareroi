import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServizioProva } from '../../servizio/servizio-prova';

@Component({
  selector: 'app-dettaglio',
  imports: [NgIf, RouterLink],
  templateUrl: './dettaglio.html',
})
export class Dettaglio {
  persona: { id: number; nome: string; cognome: string; eta: number } | undefined;

  constructor(
    private servizioProva: ServizioProva,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.persona = this.servizioProva.getPersona(id);
  }
}
