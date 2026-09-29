import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Pagina0 } from './pagina0';

describe('Pagina0', () => {
  let component: Pagina0;
  let fixture: ComponentFixture<Pagina0>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagina0],
      providers: [provideRouter([])], // il template usa routerLink: serve il router
    }).compileComponents();

    fixture = TestBed.createComponent(Pagina0);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
