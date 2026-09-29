import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-provafiglio',
  imports: [],
  templateUrl: './provafiglio.html',
})
export class Provafiglio implements OnInit {
  @Input() data: { nome: string; cognome: string; isOnline: boolean }[] = [];
  @Output() scelto = new EventEmitter<string>();
  @Output() mandaDatiEvento = new EventEmitter<string>();


  ngOnInit(): void {
    console.log(this.data);
  }

  scegli(nome: string): void {
    this.scelto.emit(nome);
  }
}
