import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { DettagliEroe } from './dettagli-eroe';

describe('DettagliEroe', () => {
  let component: DettagliEroe;
  let fixture: ComponentFixture<DettagliEroe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliEroe],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DettagliEroe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
