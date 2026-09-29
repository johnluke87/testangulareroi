import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-referenceelemento',
  imports: [],
  templateUrl: './referenceelemento.html',
})
export class Referenceelemento {

  @ViewChild('inputsaluti') inputsaluti!: ElementRef<HTMLInputElement>; 
  //decoratore che dice che abbiamo un figlio nella view. qualcosa di visibile per utente
  //ElementRef è un tipo di dato che rappresenta un elemento del DOM
  //nativeElement è un oggetto che rappresenta l'elemento del DOM
  //inputsaluti è il nome dell'elemento nella view
  //!: dice a typescript che non è null e che non è undefined e che è obbligatorio

  valore = 'ciao';

  ngOnInit(): void {
    console.log('init inputsaluti**', this.inputsaluti);//qui è undefind perchè non c'è ancora nulla all init. devo farlo al after viewinit
  }

  ngAfterViewInit(): void {
    console.log('afterViewInit inputsaluti', this.inputsaluti);
  }

  buttonClick(): void {
    console.log('buttonClick', this.inputsaluti.nativeElement.value); //nativeElement è il DOM element
    this.valore = this.inputsaluti.nativeElement.value;
  }
}
