import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Corso {
  id: string;
  titolo: string;
  docente: string;
  ore: number;
  attivo: boolean;
}

// Un corso come sta sul database: l'id non è dentro l'oggetto, è la sua chiave.
export type DatiCorso = Omit<Corso, 'id'>;

// Firebase Realtime Database via REST:
//   endpoint = URL del database + percorso del nodo + ".json"
//   GET    /corsi.json          legge tutto il nodo corsi
//   POST   /corsi.json          aggiunge un figlio con id generato, risponde { name: 'id' }
//   PUT    /corsi/ID.json       sostituisce il corso ID
//   PATCH  /corsi/ID.json       cambia solo i campi inviati
//   DELETE /corsi/ID.json       elimina, risponde null
@Injectable({ providedIn: 'root' })
export class CorsiFirebase {
  private http = inject(HttpClient);
  private base = `${environment.firebaseUrl}/corsi`;

  // HttpClient mette già Content-Type: application/json quando il body è un oggetto.
  // Lo scriviamo esplicitamente per vedere come si passano gli header.
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  lista(): Observable<Corso[]> {
    // Query params: ?orderBy="$key" ordina per chiave (cioè per data di creazione).
    const params = new HttpParams().set('orderBy', '"$key"');
    return this.http
      .get<Record<string, DatiCorso> | null>(`${this.base}.json`, { params })
      .pipe(
        // Firebase risponde con un oggetto { id1: {...}, id2: {...} }, oppure null se vuoto.
        map((dati) => Object.entries(dati ?? {}).map(([id, corso]) => ({ id, ...corso }))),
        catchError(this.gestisciErrore),
      );
  }

  crea(corso: DatiCorso): Observable<Corso> {
    return this.http
      .post<{ name: string }>(`${this.base}.json`, corso, { headers: this.headers })
      .pipe(
        map((risposta) => ({ id: risposta.name, ...corso })),
        catchError(this.gestisciErrore),
      );
  }

  sostituisci(corso: Corso): Observable<Corso> {
    const { id, ...dati } = corso;
    return this.http
      .put<DatiCorso>(`${this.base}/${id}.json`, dati, { headers: this.headers })
      .pipe(
        map((salvato) => ({ id, ...salvato })),
        catchError(this.gestisciErrore),
      );
  }

  aggiorna(id: string, campi: Partial<DatiCorso>): Observable<Partial<DatiCorso>> {
    return this.http
      .patch<Partial<DatiCorso>>(`${this.base}/${id}.json`, campi, { headers: this.headers })
      .pipe(catchError(this.gestisciErrore));
  }

  elimina(id: string): Observable<null> {
    return this.http.delete<null>(`${this.base}/${id}.json`).pipe(catchError(this.gestisciErrore));
  }

  private gestisciErrore(err: HttpErrorResponse) {
    const messaggio =
      err.status === 0
        ? 'Server non raggiungibile: controlla firebaseUrl o avvia npm run firebase-finto'
        : err.status === 401 || err.status === 403
          ? 'Permesso negato: controlla le regole del database su Firebase'
          : `Errore ${err.status}: ${err.error?.error ?? err.message}`;
    return throwError(() => new Error(messaggio));
  }
}
