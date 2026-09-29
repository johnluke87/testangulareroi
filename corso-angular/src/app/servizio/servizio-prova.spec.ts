import { TestBed } from '@angular/core/testing';

import { ServizioProva } from './servizio-prova';

describe('ServizioProva', () => {
  let service: ServizioProva;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServizioProva);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
