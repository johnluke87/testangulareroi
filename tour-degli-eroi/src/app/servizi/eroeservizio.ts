import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Eroe } from '../eroe';
import { Notificheservizio } from './notificheservizio';

@Injectable({
  providedIn: 'root',
})
export class Eroeservizio {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://www.gianlucadario.com/extra/smc/eroi.json';

  getEroi(): Observable<Eroe[]> {
    this.notificheservizio.addNotifiche('Eroi aggiunti');
    return this.caricaEroi();
  }

  getEroe(id: number): Observable<Eroe | undefined> {
    return this.caricaEroi().pipe(
      map((eroi) => eroi.find((eroe) => eroe.id === id)),
    );
  }

  private caricaEroi(): Observable<Eroe[]> {
    return this.http.get<Eroe[]>(this.url);
  }

  constructor(private notificheservizio: Notificheservizio) {

  }
}
