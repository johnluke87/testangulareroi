import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Eroe } from './eroe';

@Injectable({
  providedIn: 'root',
})
export class Eroeservizio {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://www.gianlucadario.com/extra/smc/eroi.json';

  getEroi(): Observable<Eroe[]> {
    return this.http.get<Eroe[]>(this.url);
  }
}
