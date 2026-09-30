import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  private readonly elemento = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => this.elemento.nativeElement.focus());
  }
}
