import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AttivitaStore } from './attivita.store';

describe('AttivitaStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('aggiunge un attività in cima', () => {
    const store = TestBed.inject(AttivitaStore);
    store.aggiungi('Studiare i signal', 'alta');
    expect(store.elenco()[0]?.titolo).toBe('Studiare i signal');
    expect(store.aperte()).toBeGreaterThan(0);
  });
});
