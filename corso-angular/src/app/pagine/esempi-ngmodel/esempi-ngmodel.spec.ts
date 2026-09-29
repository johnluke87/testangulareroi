import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EsempiNgmodel } from './esempi-ngmodel';

describe('EsempiNgmodel', () => {
  let component: EsempiNgmodel;
  let fixture: ComponentFixture<EsempiNgmodel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsempiNgmodel],
    }).compileComponents();

    fixture = TestBed.createComponent(EsempiNgmodel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
