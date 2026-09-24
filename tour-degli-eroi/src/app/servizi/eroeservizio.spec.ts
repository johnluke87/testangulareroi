import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { Eroeservizio } from './eroeservizio';

describe('Eroeservizio', () => {
  let service: Eroeservizio;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(Eroeservizio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
