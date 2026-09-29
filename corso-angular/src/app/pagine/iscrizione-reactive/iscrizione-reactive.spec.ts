import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IscrizioneReactive } from './iscrizione-reactive';

describe('IscrizioneReactive', () => {
  let component: IscrizioneReactive;
  let fixture: ComponentFixture<IscrizioneReactive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IscrizioneReactive],
    }).compileComponents();

    fixture = TestBed.createComponent(IscrizioneReactive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
