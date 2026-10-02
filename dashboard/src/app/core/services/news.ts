import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { switchMap, timer } from 'rxjs';
import { NewsFeed, NewsItem, NewsResponse } from '../../models/news';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

//il server tiene ogni feed in cache 15 minuti: ricaricare più spesso non servirebbe
const REFRESH_MS = 15 * 60 * 1000;
//la sezione scelta è una comodità di QUESTO browser: basta localStorage
const FEED_STORAGE_KEY = 'dashboard.newsFeed';

/** Le notizie ANSA, lette attraverso il nostro server (/news). */
@Injectable({
  providedIn: 'root',
})
export class News {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  /** Le sezioni disponibili (Ultima ora, Cronaca, Sport...): l'elenco lo decide il server. */
  readonly feeds = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<NewsFeed[]>(`${this.api}/news/feeds`),
  });

  readonly feedList = computed<NewsFeed[]>(() => (this.feeds.hasValue() ? (this.feeds.value() ?? []) : []));

  /** La sezione scelta. Cambiandola, la risorsa qui sotto si ricarica da sola (è nei params). */
  readonly selectedFeed = signal(readSavedFeed());

  readonly news = rxResource({
    params: () => (this.auth.user() ? this.selectedFeed() : undefined),
    // subito, e poi ogni 15 minuti (la nuova scheda può restare aperta a lungo)
    stream: ({ params: feed }) =>
      timer(0, REFRESH_MS).pipe(
        switchMap(() => this.http.get<NewsResponse>(`${this.api}/news`, { params: { feed } })),
      ),
  });

  readonly items = computed<NewsItem[]>(() => (this.news.hasValue() ? (this.news.value()?.items ?? []) : []));

  constructor() {
    // ogni volta che cambi sezione, me la ricordo per la prossima apertura
    effect(() => saveFeed(this.selectedFeed()));
  }
}

function readSavedFeed(): string {
  try {
    return localStorage.getItem(FEED_STORAGE_KEY) ?? 'topnews';
  } catch {
    return 'topnews';
  }
}

function saveFeed(feed: string): void {
  try {
    localStorage.setItem(FEED_STORAGE_KEY, feed);
  } catch {
    // navigazione privata o dati bloccati: pazienza, si riparte da "Ultima ora"
  }
}
