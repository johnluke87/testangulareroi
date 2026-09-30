import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Coordinates } from '../../models/weather';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class DeviceLocation {
  //trasforma la callback di navigator.geolocation in un Observable
  getPosition(): Observable<Coordinates> {
    return new Observable<Coordinates>((subscriber) => {
      if (!('geolocation' in navigator)) {
        subscriber.error(new Error('Geolocalizzazione non supportata dal browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          subscriber.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          subscriber.complete();
        },
        (error) => subscriber.error(error),
        //per il meteo basta la precisione della rete, e una posizione di 5 minuti fa va bene
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: FIVE_MINUTES_MS },
      );
    });
  }
}
