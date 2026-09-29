import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Iscrizione } from './iscrizione';

describe('Iscrizione', () => {
  let component: Iscrizione;
  let fixture: ComponentFixture<Iscrizione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Iscrizione],
    }).compileComponents();

    fixture = TestBed.createComponent(Iscrizione);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
