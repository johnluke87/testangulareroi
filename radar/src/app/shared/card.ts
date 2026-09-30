import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Opportunity } from '../core/models';

@Component({
  selector: 'app-card',
  imports: [RouterLink],
  template: `
    <a class="card shadow-sm h-100 text-decoration-none text-body" [routerLink]="['/luogo', item().id]">
      <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge text-bg-primary">{{ item().label || item().emoji }}</span>
        <span class="text-secondary small">{{ item().sources.join(' + ') }}</span>
      </div>
      <h3 class="h5">{{ item().title }}</h3>
      <p class="mb-2">{{ item().summary }}</p>
      @if (item().facts) { <p class="small mb-2">{{ item().facts }}</p> }
      <div class="d-flex flex-wrap gap-2">
        <span class="badge text-bg-light">{{ item().minutes }} min</span>
        <span class="badge text-bg-light">{{ item().price_label }}</span>
      </div>
      @if (item().why) { <p class="text-secondary small mt-2 mb-0">{{ item().why }}</p> }
      </div>
    </a>
  `,
})
export class Card {
  item = input.required<Opportunity>();
  acted = output<string>();
}
