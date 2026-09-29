import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Referenceelemento } from './referenceelemento';

describe('Referenceelemento', () => {
  let component: Referenceelemento;
  let fixture: ComponentFixture<Referenceelemento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Referenceelemento],
    }).compileComponents();

    fixture = TestBed.createComponent(Referenceelemento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
