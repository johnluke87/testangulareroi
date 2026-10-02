import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { SavedLink } from '../../models/link';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Links {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  private readonly list = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<SavedLink[]>(`${this.api}/links`),
  });

  readonly links = computed(() => (this.list.hasValue() ? this.list.value() : []));
  readonly isLoading = computed(() => this.list.isLoading());
  readonly error = computed(() => this.list.error());

  create(label: string, url: string): Observable<SavedLink[]> {
    return this.http.post<SavedLink[]>(`${this.api}/links`, { label, url }).pipe(tap(() => this.list.reload()));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/links/${id}`).pipe(tap(() => this.list.reload()));
  }
}
