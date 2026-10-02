import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, from, mergeMap, Observable, tap, toArray } from 'rxjs';
import { NewTask, Task, TaskChanges } from '../../models/task';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

/**
 * L'unico punto dell'app che parla con l'API dei task.
 * Tiene in memoria la lista: i componenti la leggono da qui e chiedono a questo servizio di modificarla.
 */
@Injectable({
  providedIn: 'root',
})
export class Tasks {
  private http = inject(HttpClient);//serve per fare le richieste HTTP al server (get, post, patch, delete)
  private api = inject(API_BASE_URL);//serve per indicare l'URL dell'API

  //la lista scaricata dal server (tutti i task, anche quelli fatti); la richiesta parte da sola alla creazione del servizio rxResource è un observable che si occupa di gestire il ciclo di vita della lista
  //quando nasce il servizio, cioè la prima volta che un componente lo usa, la scatola esegue la funzione stream, che fa la GET /extra/dashboard/api/tasks?status=all;
  //mentre aspetta la risposta, sa di essere "in caricamento";
  //quando arriva la risposta, dentro c'è l'array dei task;
  //se qualcosa va storto, dentro c'è l'errore.
  private auth = inject(Auth);

  //MULTI-UTENTE: params = chi è collegato. Quando cambia utente (logout e login di un amico sullo stesso browser)
  //la risorsa si ricarica da sola; quando non c'è nessuno (undefined) non carica niente e la lista resta vuota.
  //Così i task di un utente non restano mai in memoria per quello dopo.
  private readonly list = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<Task[]>(`${this.api}/tasks`, { params: { status: 'all' } }),
  });

  //sempre un array, anche mentre carica o se c'è un errore: chi lo usa non deve fare controlli
  //La scatola list è privata. Fuori esponiamo tre "finestrelle" in sola lettura:
  //tasks(): l'array dei task. Se la scatola è ancora vuota, o contiene un errore, restituisce []. Così il pannello può scrivere sempre tasks().filter(...) senza chiedersi "ma è già arrivato?". Il controllo con hasValue() serve anche perché leggere value() mentre c'è un errore fa lanciare un'eccezione.
  //isLoading(): true mentre aspetta il server.
  //error(): l'errore, se c'è.
  readonly tasks = computed(() => (this.list.hasValue() ? this.list.value() : []));//computed è un observable che si occupa di gestire il ciclo di vita della lista
  readonly isLoading = computed(() => this.list.isLoading());
  readonly error = computed(() => this.list.error());

  //ogni modifica: chiamata all'API e, se va bene, ricarico la lista (l'ordine lo decide il server)
  create(task: NewTask): Observable<Task> {
    return this.http.post<Task>(`${this.api}/tasks`, task).pipe(tap(() => this.list.reload()));
  }

  //a richiesta parte solo quando qualcuno chiama .subscribe()  
  //e, per ottenere la risposta, ci vuole un altro .subscribe()
  update(id: number, changes: TaskChanges): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/tasks/${id}`, changes).pipe(tap(() => this.list.reload()));
  }

  //a richiesta parte solo quando qualcuno chiama .subscribe()  
  //e, per ottenere la risposta, ci vuole un altro .subscribe()
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tasks/${id}`).pipe(tap(() => this.list.reload()));
  }

  /**
   * Elimina più task. Una DELETE per task (l'API ne cancella uno alla volta), al massimo 4 in parallelo
   * (mergeMap con concorrenza 4: non sommergiamo il server), e UNA sola ricarica della lista alla fine.
   * finalize: ricarico anche se qualcuna fallisce, così la lista mostra cosa è stato davvero eliminato.
   */
  removeMany(ids: number[]): Observable<void[]> {
    return from(ids).pipe(
      mergeMap((id) => this.http.delete<void>(`${this.api}/tasks/${id}`), 4),
      toArray(),
      finalize(() => this.list.reload()),
    );
  }
}
