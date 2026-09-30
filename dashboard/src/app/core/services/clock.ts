import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Clock {
  //signal now che contiene la data attuale e si aggiorna ogni secondo:
  readonly now = toSignal(interval(1000).pipe(map(() => new Date())), { initialValue: new Date() });
}
