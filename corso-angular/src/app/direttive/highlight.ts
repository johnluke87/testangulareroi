import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class Highlight {
  @Input() defaultColor = '';
  private scelto = '';

  @Input() set appHighlight(colore: string) {
    this.scelto = colore;
    this.cambiaColore(this.coloreAttivo());
  }

  ngOnInit(): void {
    this.cambiaColore(this.coloreAttivo());
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.cambiaColore(this.coloreAttivo());
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.cambiaColore(this.defaultColor);
  }

  private coloreAttivo(): string {
    return this.scelto || this.defaultColor;
  }

  cambiaColore(colore: string) {
    this.el.nativeElement.style.backgroundColor = colore;
  }
  
  constructor(private el: ElementRef<HTMLElement>) {}
}
