import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Notifiche } from './notifiche';

describe('Notifiche', () => {
  let component: Notifiche;
  let fixture: ComponentFixture<Notifiche>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Notifiche],
    }).compileComponents();

    fixture = TestBed.createComponent(Notifiche);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
