import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  effect,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-ciclo-vita',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ciclo-vita.html',
})
export class CicloVita implements OnInit {
  protected readonly diario = signal<string[]>([]);
  protected readonly contatore = signal(0);
  private readonly casella = viewChild<ElementRef<HTMLInputElement>>('casella');

  constructor() {
    this.scrivi('constructor: la classe esiste, il template no');
    afterNextRender(() => this.scrivi('afterNextRender: il DOM di questo componente c’è'));
    effect(() => {
      const n = this.contatore();
      untracked(() => this.scrivi(`effect: contatore vale ${n}`));
    });
  }

  ngOnInit(): void {
    this.scrivi('ngOnInit: gli input sono pronti, il DOM ancora no');
  }

  mettiFuoco(): void {
    this.casella()?.nativeElement.focus();
  }

  private scrivi(riga: string): void {
    this.diario.update((righe) => [...righe, riga]);
  }
}
