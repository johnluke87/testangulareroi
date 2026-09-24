import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Eroi } from './eroi';

describe('Eroi', () => {
  let component: Eroi;
  let fixture: ComponentFixture<Eroi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Eroi],
    }).compileComponents();

    fixture = TestBed.createComponent(Eroi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
