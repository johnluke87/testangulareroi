import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Eroi } from './eroi/eroi';

@Component({
  selector: 'app-root',
  imports: [Eroi],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly numero = signal(1);
  protected readonly title = computed(() => `App degli eroi ${this.numero()}`);

  constructor() {
    const timer = setInterval(() => {
      this.numero.update((n) => (n === 5 ? 1 : n + 1));
    }, 1000);

    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}