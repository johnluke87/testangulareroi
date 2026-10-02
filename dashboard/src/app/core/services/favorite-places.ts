import { moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, concatMap, from, last, Observable, of, switchMap } from 'rxjs';
import { Place } from '../../models/weather';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

/** Una località preferita come arriva dall'API: è un Place + l'id della riga nel database. */
export interface FavoritePlace extends Place {
  favoriteId: number;
}

//dove la VECCHIA versione dell'app salvava i preferiti (nel browser): li importiamo una volta sul server
const LEGACY_STORAGE_KEY = 'dashboard.favoritePlaces';

/**
 * Le località preferite del meteo, salvate sul server PER UTENTE (tabella dashboard_favorite_places).
 * Stesso schema del servizio Tasks: una lista in memoria caricata con rxResource, e metodi che la modificano.
 * Differenza: qui i metodi fanno loro il subscribe (restituiscono void), perché chi li usa
 * (l'editor dei preferiti) non ha bisogno di sapere quando hanno finito.
 */
@Injectable({
  providedIn: 'root',
})
export class FavoritePlaces {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  //come per i task: si ricarica quando cambia utente, ed è vuota se non è collegato nessuno
  private readonly list = rxResource({
    params: () => this.auth.user()?.username,
    stream: () =>
      this.http
        .get<FavoritePlace[]>(`${this.api}/places`)
        .pipe(switchMap((places) => this.importLegacyPlaces(places))),
  });

  readonly places = computed<FavoritePlace[]>(() => (this.list.hasValue() ? this.list.value() : []));

  has(id: string): boolean {
    return this.places().some((p) => p.id === id);
  }

  add(place: Place): void {
    if (this.has(place.id)) {
      return;
    }
    //il server risponde con la lista aggiornata: la metto direttamente nella risorsa, niente seconda richiesta
    this.http.post<FavoritePlace[]>(`${this.api}/places`, toRequestBody(place)).subscribe({
      next: (places) => this.list.set(places),
      error: () => this.list.reload(),
    });
  }

  remove(id: string): void {
    const favorite = this.places().find((p) => p.id === id);
    if (!favorite) {
      return;
    }
    //aggiornamento "ottimista": tolgo subito la riga dallo schermo, senza aspettare il server;
    //se il server dà errore ricarico la lista vera
    this.list.update((places) => places?.filter((p) => p.id !== id));
    this.http.delete(`${this.api}/places/${favorite.favoriteId}`).subscribe({
      error: () => this.list.reload(),
    });
  }

  toggle(place: Place): void {
    if (this.has(place.id)) {
      this.remove(place.id);
    } else {
      this.add(place);
    }
  }

  /** Trascinamento nell'editor: sposto subito sullo schermo, poi mando al server il nuovo ordine. */
  move(fromIndex: number, toIndex: number): void {
    const reordered = [...this.places()];
    moveItemInArray(reordered, fromIndex, toIndex);
    this.list.set(reordered);

    const ids = reordered.map((p) => p.favoriteId);
    this.http.post<FavoritePlace[]>(`${this.api}/places/order`, { ids }).subscribe({
      error: () => this.list.reload(),
    });
  }

  /**
   * Una volta sola: se sul server non hai ancora località ma il browser ha quelle della vecchia versione,
   * le carico sul server una alla volta (concatMap = in fila, così l'ordine resta quello) e poi le tolgo dal browser.
   */
  private importLegacyPlaces(serverPlaces: FavoritePlace[]): Observable<FavoritePlace[]> {
    const legacy = readLegacyPlaces();
    if (serverPlaces.length > 0 || legacy.length === 0) {
      return of(serverPlaces);
    }
    clearLegacyPlaces(); //prima di importare: se qualcosa va storto non ci riprova a ogni avvio

    return from(legacy).pipe(
      concatMap((place) => this.http.post<FavoritePlace[]>(`${this.api}/places`, toRequestBody(place))),
      last(), //mi interessa solo la risposta all'ultimo POST: contiene la lista completa
      catchError(() => of(serverPlaces)),
    );
  }
}

/** Solo i campi che il PHP si aspetta (niente favoriteId, che decide il database). */
function toRequestBody(place: Place) {
  const { id, name, region, country, latitude, longitude } = place;
  return { id, name, region: region ?? null, country: country ?? null, latitude, longitude };
}

//localStorage può non esserci o lanciare eccezioni (navigazione privata, dati bloccati)
function readLegacyPlaces(): Place[] {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Place[]) : [];
  } catch {
    return [];
  }
}

function clearLegacyPlaces(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    //niente da fare
  }
}
