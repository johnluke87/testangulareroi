import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { Note } from '../../models/note';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Notes {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  private readonly list = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<Note[]>(`${this.api}/notes`),
  });

  readonly notes = computed(() => (this.list.hasValue() ? this.list.value() : []));
  readonly isLoading = computed(() => this.list.isLoading());
  readonly error = computed(() => this.list.error());

  create(body: string): Observable<Note[]> {
    return this.http.post<Note[]>(`${this.api}/notes`, { body }).pipe(tap(() => this.list.reload()));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/notes/${id}`).pipe(tap(() => this.list.reload()));
  }
}
