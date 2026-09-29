import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Provafiglio } from './provafiglio';

describe('Provafiglio', () => {
  let component: Provafiglio;
  let fixture: ComponentFixture<Provafiglio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Provafiglio],
    }).compileComponents();

    fixture = TestBed.createComponent(Provafiglio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
