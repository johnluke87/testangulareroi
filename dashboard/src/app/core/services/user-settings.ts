import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api';
import { SearchEngineId } from '../../shared/search-engines';
import { Auth } from './auth';

/** Le impostazioni personali come arrivano da GET /settings. */
export interface Settings {
  bggUsername: string | null;
  searchEngine: SearchEngineId;
}

/** Impostazioni dell'utente collegato (per ora l'utente BoardGameGeek; poi Google). Stesso schema di Tasks. */
@Injectable({
  providedIn: 'root',
})
export class UserSettings {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  private readonly resource = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<Settings>(`${this.api}/settings`),
  });

  readonly settings = computed<Settings | undefined>(() => (this.resource.hasValue() ? this.resource.value() : undefined));
  readonly isLoading = computed(() => this.resource.isLoading());

  update(changes: Partial<Settings>): Observable<Settings> {
    //il server restituisce le impostazioni aggiornate: le metto direttamente nella risorsa
    return this.http.patch<Settings>(`${this.api}/settings`, changes).pipe(tap((s) => this.resource.set(s)));
  }
}
