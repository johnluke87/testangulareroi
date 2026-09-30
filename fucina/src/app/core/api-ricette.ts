import { InjectionToken } from '@angular/core';

/**
 * InjectionToken: quando il valore da iniettare non è una classe.
 * Qui è l'indirizzo base delle ricette (DummyJSON, senza chiave API).
 * providedIn: 'root' lo registra nell'injector dell'applicazione, uno solo per tutta l'app.
 */
export const API_RICETTE = new InjectionToken<string>('API_RICETTE', {
  providedIn: 'root',
  factory: () => 'https://dummyjson.com',
});
