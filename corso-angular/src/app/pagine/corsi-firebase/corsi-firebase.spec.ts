import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorsiFirebasePagina } from './corsi-firebase';

describe('CorsiFirebasePagina', () => {
  let component: CorsiFirebasePagina;
  let fixture: ComponentFixture<CorsiFirebasePagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorsiFirebasePagina],
    }).compileComponents();

    fixture = TestBed.createComponent(CorsiFirebasePagina);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
