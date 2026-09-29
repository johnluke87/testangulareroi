import { afterNextRender, AfterContentChecked, Component, OnDestroy, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { Provafiglio } from '../provafiglio/provafiglio';
@Component({
  selector: 'app-prova',
  imports: [MatButton, MatFormField, MatLabel, MatInput, NgIf, NgFor, NgClass, NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault, Provafiglio],
  templateUrl: './prova.html',
  styleUrl: './prova.scss',
})

export class Prova implements OnDestroy, AfterContentChecked {
  protected readonly isDisabled = signal(false);
  private intervallo?: ReturnType<typeof setInterval>;

  valore = signal('');
  title = signal('');
  isOnline = signal(false);
  scelto = signal('');

  datiRicevuti = signal('');

  persone = signal([
    { nome: 'Mario', cognome: 'Rossi',isOnline: true },
    { nome: 'Luigi', cognome: 'Bianchi',isOnline: false },
    { nome: 'Giuseppe', cognome: 'Verdi',isOnline: true  },
    { nome: 'Francesco', cognome: 'Neri',isOnline: false },
    { nome: 'Francesco', cognome: 'Neri',isOnline: false },
    { nome: 'Francesco', cognome: 'Neri',isOnline: false },
  ]);

  onMandaDatiEvento(dati: string): void {
    this.datiRicevuti.set(dati);
  }
  
  onInput(e: Event): void {
    this.valore.set((<HTMLInputElement>e.target).value);
    console.log('onInput', (<HTMLInputElement>e.target).value);
  }

  onTitle(e: Event): void {
    this.title.set((<HTMLInputElement>e.target).value);
  }

  onScelto(nome: string): void {
    this.scelto.set(nome);
  }

  onClick(e: any): void {
    console.log('onClick clicco', e);
    this.isOnline.set(!this.isOnline());
    this.title.set("ho cliccato sul bottone");
  }

  constructor() {
    console.log('costruttore');

    afterNextRender(() => {
      console.log('Prova iniziata');
      this.intervallo = setInterval(() => {
        this.isDisabled.update((valore) => !valore);
      }, 2000);
    });
  }

  ngAfterContentChecked(): void {
    console.log('Prova content checked');
  }

  ngOnDestroy(): void {
    console.log('Prova distrutta');
    clearInterval(this.intervallo);
  }
}