import { ElementRef } from '@angular/core';
import { Highlight } from './highlight';

describe('Highlight', () => {
  // Il constructor della direttiva vuole l'elemento su cui lavora: gliene diamo uno finto.
  function creaDirettiva() {
    const elemento = document.createElement('p');
    return { elemento, direttiva: new Highlight(new ElementRef(elemento)) };
  }

  it('should create an instance', () => {
    expect(creaDirettiva().direttiva).toBeTruthy();
  });

  it('colora lo sfondo con il colore scelto', () => {
    const { elemento, direttiva } = creaDirettiva();
    direttiva.appHighlight = 'yellow';
    expect(elemento.style.backgroundColor).toBe('yellow');
  });

  it('torna al colore predefinito quando il mouse esce', () => {
    const { elemento, direttiva } = creaDirettiva();
    direttiva.defaultColor = 'pink';
    direttiva.appHighlight = 'yellow';
    direttiva.onMouseLeave();
    expect(elemento.style.backgroundColor).toBe('pink');
  });
});
