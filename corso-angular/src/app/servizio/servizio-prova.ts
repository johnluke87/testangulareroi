import { Injectable } from '@angular/core';

@Injectable({
  //significa che possiamo iniettare il nostro services in giro. il service è uns apecie di cervallo generale. uno che sgestisceil login. uno che becca i dati dei clienti.. etc.. si occupano della logica del nostro app. service = comunicazione facile
  providedIn: 'root', //significa che chiunque puo chiamarlo con "root"
})
export class ServizioProva {
  persone = [{
    id: 1,
    nome: 'Mario',
    cognome: 'Rossi',
    eta: 30,
  }, {
    id: 2,
    nome: 'Luigi',
    cognome: 'Bianchi',
    eta: 25,
  }, {
    id: 3,
    nome: 'Giovanni',
    cognome: 'Verdi',
    eta: 35,
  }];

  getPersone() {
    return this.persone;
  }

  getPersona(id: string) {
    return this.persone.find((persona) => String(persona.id) === id);
  }
}
