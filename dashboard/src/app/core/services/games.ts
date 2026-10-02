import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { defer, repeat, take, takeWhile } from 'rxjs';
import { CollectionGame, GamesResponse, HotGame } from '../../models/game';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';
import { UserSettings } from './user-settings';

//BGG prepara le collezioni "con calma": quando risponde pending riproviamo ogni 5 secondi.
//Stessa cosa mentre il server scarica i pesi dei giochi (40 per volta): con 400 giochi servono ~10 giri.
const PENDING_RETRY_MS = 5000;
const PENDING_MAX_ATTEMPTS = 20;

/** I giochi da tavolo: "del momento" e la collezione BGG dell'utente collegato. */
@Injectable({
  providedIn: 'root',
})
export class Games {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);
  private userSettings = inject(UserSettings);

  /** I giochi più chiacchierati su BGG (uguali per tutti, ma solo per chi è collegato). */
  readonly hot = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<GamesResponse<HotGame>>(`${this.api}/games/hot`),
  });

  /**
   * La collezione. params = il nome utente BGG: se lo cambi nelle impostazioni, la collezione si ricarica da sola.
   * Lo stream può emettere PIÙ valori: prima "pending" (e il pannello mostra "BGG la sta preparando…"),
   * poi, dopo qualche tentativo, "ok" con i giochi.
   */
  readonly collection = rxResource({
    //undefined (= non caricare) finché non sappiamo chi è collegato E quali sono le sue impostazioni
    params: () => {
      const settings = this.userSettings.settings();
      return this.auth.user() && settings ? { bgg: settings.bggUsername } : undefined;
    },
    stream: () =>
      // defer: crea la richiesta da capo a ogni tentativo
      defer(() => this.http.get<GamesResponse<CollectionGame>>(`${this.api}/games/collection`)).pipe(
        repeat({ delay: PENDING_RETRY_MS }), //finita una richiesta, ne rifà un'altra dopo 5 secondi...
        //...finché la collezione è "pending" o mancano dei pesi (true = emetti anche l'ultima risposta)
        takeWhile((res) => res.status === 'pending' || !!res.weightsPending, true),
        take(PENDING_MAX_ATTEMPTS), //...ma non all'infinito
      ),
  });

  /** I giochi del momento, sempre un array (vuoto mentre carica o in caso di errore). */
  readonly hotGames = computed<HotGame[]>(() => (this.hot.hasValue() ? (this.hot.value()?.games ?? []) : []));

  /** Lo stato della collezione, o undefined se non è ancora arrivata o c'è un errore (value() in errore lancerebbe). */
  readonly collectionStatus = computed(() =>
    this.collection.hasValue() ? this.collection.value()?.status : undefined,
  );

  /** Il server sta ancora scaricando il peso di qualche gioco? */
  readonly weightsPending = computed(() => this.collection.hasValue() && !!this.collection.value()?.weightsPending);

  /** Sempre un array, come per i task. */
  readonly collectionGames = computed<CollectionGame[]>(() =>
    this.collection.hasValue() ? (this.collection.value()?.games ?? []) : [],
  );
}
