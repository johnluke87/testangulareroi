import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap, timer } from 'rxjs';
import { CalendarEvent, CalendarsResponse, EventsResponse, GoogleStatus } from '../../models/agenda';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

//ogni quanto ricaricare gli eventi se la pagina resta aperta (la "nuova scheda" può restare aperta tutto il giorno)
const EVENTS_REFRESH_MS = 10 * 60 * 1000;
const EVENTS_DAYS = 7;

/**
 * Google Calendar dell'utente collegato. Angular NON parla mai con Google:
 * chiede tutto al nostro server, che tiene i token di Google (cifrati) e fa lui le chiamate.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleCalendar {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  /** Il server è configurato? Sei collegato? Con quale email? */
  readonly status = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<GoogleStatus>(`${this.api}/google/status`),
  });

  /** Lo stato, o undefined finché non è arrivato (o se c'è un errore: lì value() lancerebbe). */
  readonly statusInfo = computed<GoogleStatus | undefined>(() =>
    this.status.hasValue() ? this.status.value() : undefined,
  );

  readonly isConnected = computed(() => !!this.statusInfo()?.connected);

  /** I calendari (solo se collegato: altrimenti params è undefined e non parte nessuna richiesta). */
  readonly calendars = rxResource({
    params: () => (this.isConnected() ? this.auth.user()?.username : undefined),
    stream: () => this.http.get<CalendarsResponse>(`${this.api}/google/calendars`),
  });

  /**
   * Gli eventi dei prossimi 7 giorni. timer(0, 10 minuti): subito, e poi ogni 10 minuti;
   * switchMap: a ogni "tic" fa una nuova richiesta (e, se la precedente non è finita, la annulla).
   */
  readonly events = rxResource({
    params: () => (this.isConnected() ? this.auth.user()?.username : undefined),
    stream: () =>
      timer(0, EVENTS_REFRESH_MS).pipe(
        switchMap(() => this.http.get<EventsResponse>(`${this.api}/google/events`, { params: { days: EVENTS_DAYS } })),
      ),
  });

  /** Sempre un array (vuoto mentre carica, in caso di errore o se non collegato). */
  readonly eventList = computed<CalendarEvent[]>(() =>
    this.events.hasValue() ? (this.events.value()?.events ?? []) : [],
  );

  /** "reconnect" = Google non accetta più il permesso: va ricollegato dalle impostazioni. */
  readonly needsReconnect = computed(
    () =>
      (this.events.hasValue() && this.events.value()?.status === 'reconnect') ||
      (this.calendars.hasValue() && this.calendars.value()?.status === 'reconnect'),
  );

  /**
   * "Collega Google": NON è una chiamata HTTP di Angular ma una navigazione dell'intera pagina,
   * perché il browser deve andare davvero su Google (schermata di consenso) e poi tornare qui.
   * returnUrl = la pagina impostazioni di QUESTA app (localhost:4200 in sviluppo, il sito vero in produzione).
   */
  connect(): void {
    const returnUrl = new URL('settings', document.baseURI).href;
    window.location.href = `${this.api}/google/connect?return=${encodeURIComponent(returnUrl)}`;
  }

  disconnect(): Observable<unknown> {
    return this.http.delete(`${this.api}/google`).pipe(tap(() => this.status.reload()));
  }

  /** Salva quali calendari mostrare e ricarica gli eventi. */
  saveSelection(ids: string[]): Observable<unknown> {
    return this.http.post(`${this.api}/google/calendars/selection`, { ids }).pipe(
      tap(() => {
        this.calendars.reload();
        this.events.reload();
      }),
    );
  }
}
