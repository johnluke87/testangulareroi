import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CorsiFirebase } from './corsi-firebase';
import { environment } from '../../environments/environment';

// Test di un servizio HTTP: nessuna chiamata vera parte.
// HttpTestingController intercetta le richieste e permette di rispondere a mano.
describe('CorsiFirebase', () => {
  let servizio: CorsiFirebase;
  let http: HttpTestingController;
  const base = `${environment.firebaseUrl}/corsi`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servizio = TestBed.inject(CorsiFirebase);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // fallisce se è rimasta una richiesta senza risposta

  it('lista: fa GET e trasforma l\'oggetto di Firebase in un array', () => {
    let risultato: unknown;
    servizio.lista().subscribe((corsi) => (risultato = corsi));

    const req = http.expectOne((r) => r.url === `${base}.json`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('orderBy')).toBe('"$key"');
    req.flush({ '-a1': { titolo: 'RxJS', docente: 'Bianchi', ore: 8, attivo: true } });

    expect(risultato).toEqual([
      { id: '-a1', titolo: 'RxJS', docente: 'Bianchi', ore: 8, attivo: true },
    ]);
  });

  it('lista: con il nodo vuoto (null) restituisce un array vuoto', () => {
    let risultato: unknown;
    servizio.lista().subscribe((corsi) => (risultato = corsi));
    http.expectOne((r) => r.url === `${base}.json`).flush(null);
    expect(risultato).toEqual([]);
  });

  it('crea: fa POST con il body e usa name come id', () => {
    const nuovo = { titolo: 'Angular', docente: 'Rossi', ore: 16, attivo: true };
    let risultato: unknown;
    servizio.crea(nuovo).subscribe((corso) => (risultato = corso));

    const req = http.expectOne(`${base}.json`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuovo);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({ name: '-b2' });

    expect(risultato).toEqual({ id: '-b2', ...nuovo });
  });

  it('elimina: fa DELETE sull\'endpoint del corso', () => {
    servizio.elimina('-b2').subscribe();
    const req = http.expectOne(`${base}/-b2.json`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('trasforma un 401 in un messaggio leggibile', () => {
    let messaggio = '';
    servizio.lista().subscribe({ error: (e: Error) => (messaggio = e.message) });
    http
      .expectOne((r) => r.url === `${base}.json`)
      .flush({ error: 'Permission denied' }, { status: 401, statusText: 'Unauthorized' });
    expect(messaggio).toContain('Permesso negato');
  });
});
