import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliEroe } from './dettagli-eroe';

describe('DettagliEroe', () => {
  let component: DettagliEroe;
  let fixture: ComponentFixture<DettagliEroe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliEroe],
    }).compileComponents();

    fixture = TestBed.createComponent(DettagliEroe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
