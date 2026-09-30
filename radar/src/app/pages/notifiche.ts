import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';

@Component({
  selector: 'app-notifiche',
  imports: [RouterLink],
  template: `
    <h1 class="h3 mb-1">Notifiche</h1>
    <p class="text-secondary mb-4">Poche. Un riepilogo al giorno e, solo se è particolare, un avviso.</p>
    <div class="d-flex flex-column gap-3">
      @for (n of items(); track n.id) {
        <article class="bg-white border rounded-4 p-3 p-md-4">
          <h2 class="h6 mb-1">{{ n.title }}</h2>
          <p class="text-secondary mb-3">{{ n.body }}</p>
          <div class="d-flex flex-wrap gap-2">
            @if (n.opportunity_id) {
              <a class="btn btn-dark btn-sm" [routerLink]="['/luogo', n.opportunity_id]">Apri</a>
            }
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="dismiss(n.id)">Non ora</button>
          </div>
        </article>
      } @empty {
        <p class="text-secondary">Ancora niente. Il radar scrive qui quando trova qualcosa.</p>
      }
    </div>
  `,
})
export class Notifiche {
  private api = inject(Api);
  items = signal<{ id: number; title: string; body: string; read_at: string | null; opportunity_id: number | null }[]>([]);
  constructor() { void this.load(); }
  async load(): Promise<void> {
    const res = await this.api.notifications();
    this.items.set(res.items);
  }
  async dismiss(id: number): Promise<void> {
    await this.api.dismissNotification(id);
    await this.load();
  }
}
