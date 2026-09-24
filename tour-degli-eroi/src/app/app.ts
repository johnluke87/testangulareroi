import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = computed(() => `App degli eroi`);

  constructor() {

    inject(DestroyRef).onDestroy(() => console.log('App distrutto'));
  }
}