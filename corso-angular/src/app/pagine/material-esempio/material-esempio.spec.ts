import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialEsempio } from './material-esempio';

describe('MaterialEsempio', () => {
  let component: MaterialEsempio;
  let fixture: ComponentFixture<MaterialEsempio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialEsempio],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialEsempio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
