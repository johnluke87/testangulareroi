import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../core/api';
import { Opportunity } from '../core/models';
import { Card } from '../shared/card';
import { Mappa } from '../shared/mappa';

@Component({
  selector: 'app-lista',
  imports: [Card, Mappa],
  template: `
    <header class="hero">
      <h1>{{ title() }}</h1>
      <p class="lead">{{ lead() }}</p>
    </header>
    @if (loading()) { <p class="pad">Cerco intorno a te…</p> }
    @if (error()) { <p class="error pad">{{ error() }}</p> }
    @if (data(); as d) {
      <app-mappa [latitude]="d.latitude" [longitude]="d.longitude" [items]="items()" />
      <div class="grid pad">
        @for (item of items(); track item.id) { <app-card [item]="item" /> }
        @if (!items().length) { <p>Niente che stia davvero in questo filtro, con i dati di adesso.</p> }
      </div>
    }
  `,
})
export class Lista {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  title = signal('Oggi');
  lead = signal('');
  items = signal<Opportunity[]>([]);
  data = signal<{ latitude: number; longitude: number } | null>(null);
  loading = signal(true);
  error = signal('');

  constructor() {
    const mode = this.route.snapshot.data['mode'] as string;
    const copy: Record<string, [string, string]> = {
      today: ['Oggi', 'Solo ciò che ha senso adesso, viaggio compreso.'],
      weekend: ['Più tempo', 'Idee da mezza giornata, non la lista di tutto il weekend.'],
      'two-hours': ['Ho 2 ore', 'Ci devi arrivare, stare e tornare dentro 120 minuti.'],
      free: ['Non voglio spendere', 'Solo dove la fonte indica ingresso gratuito. Se il prezzo manca, non lo chiamo gratis.'],
      surprise: ['Sorprendimi', 'Posti poco ovvi, anche fuori dalle tue solite scelte.'],
    };
    const c = copy[mode] ?? copy['today'];
    this.title.set(c[0]);
    this.lead.set(c[1]);
    void this.load(mode);
  }

  async load(mode: string): Promise<void> {
    try {
      const res = await this.api.radar({ mode, fresh: 0 });
      this.data.set(res);
      const list = mode === 'weekend' ? res.sections.weekend : mode === 'surprise' ? res.sections.unusual.concat(res.items) : res.items;
      const uniq = new Map<number, Opportunity>();
      list.forEach((i) => uniq.set(i.id, i));
      this.items.set([...uniq.values()].slice(0, 8));
    } catch (e: unknown) {
      const err = e as { error?: { error?: string } };
      this.error.set(err?.error?.error || 'Ricerca non riuscita.');
    } finally {
      this.loading.set(false);
    }
  }
}
