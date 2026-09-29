import { Component } from '@angular/core';
import { ServizioProva } from '../servizio/servizio-prova';

@Component({
  selector: 'app-prova-service-1',
  imports: [],
  templateUrl: './prova-service-1.html',
  styleUrl: './prova-service-1.scss',
})
export class ProvaService1 {

  constructor(private servizioProva: ServizioProva) {
  }

  ngOnInit() {
    console.log(this.servizioProva.getPersone()); 
  }
}
