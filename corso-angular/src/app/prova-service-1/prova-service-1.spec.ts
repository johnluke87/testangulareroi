import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvaService1 } from './prova-service-1';

describe('ProvaService1', () => {
  let component: ProvaService1;
  let fixture: ComponentFixture<ProvaService1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProvaService1],
    }).compileComponents();

    fixture = TestBed.createComponent(ProvaService1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
