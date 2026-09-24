import { TestBed } from '@angular/core/testing';

import { Notificheservizio } from './notificheservizio';

describe('Notificheservizio', () => {
  let service: Notificheservizio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notificheservizio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
