import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Opportunity } from '../core/models';
import { Mappa } from '../shared/mappa';

@Component({
  selector: 'app-dettaglio',
  imports: [RouterLink, Mappa],
  template: `
    <a class="back" routerLink="/">← Radar</a>
    @if (error()) { <p class="error pad">{{ error() }}</p> }
    @if (item(); as it) {
      <header class="hero">
        <p class="kicker">{{ it.emoji }} {{ it.municipality }}</p>
        <h1>{{ it.title }}</h1>
        <p class="lead">{{ it.summary }}</p>
        <p class="why">{{ it.why }}</p>
      </header>
      <app-mappa [latitude]="it.latitude" [longitude]="it.longitude" [items]="[it]" />
      <dl class="facts">
        <div><dt>Viaggio stimato</dt><dd>{{ it.minutes }} min · {{ it.km }} km</dd></div>
        <div><dt>Durata sul posto</dt><dd>{{ it.duration_min }}–{{ it.duration_max }} min</dd></div>
        <div><dt>Prezzo</dt><dd>{{ it.price_label }}</dd></div>
        <div><dt>Orari dalla fonte</dt><dd>{{ it.opening_hours || 'Non indicati' }}</dd></div>
        <div><dt>Adesso</dt><dd>{{ openLabel(it.open_now) }}</dd></div>
        <div><dt>Fonte</dt><dd>{{ it.source_name }}</dd></div>
      </dl>
      <p class="pad"><a [href]="it.url" target="_blank" rel="noreferrer">Apri la fonte originale</a></p>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('interested')">Mi interessa</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('not_interested')">Non mi interessa</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('save')">Salva</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('going')">Ci andrò</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('went')">Ci sono andato</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('unknown')">Non la conoscevo</button>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="send('surprise')">Non la cercavo, ma mi interessa</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="send('hide_type')">Nascondi questo tipo</button>
      </div>
      @if (note()) { <p class="pad">{{ note() }}</p> }
    }
  `,
})
export class Dettaglio {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  item = signal<Opportunity | null>(null);
  error = signal('');
  note = signal('');

  constructor() {
    void this.load();
  }

  openLabel(v: boolean | null): string {
    if (v === true) return 'Sembra aperto, in base agli orari OSM';
    if (v === false) return 'Sembra chiuso adesso';
    return 'Apertura non verificabile';
  }

  async load(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const res = await this.api.radar({ fresh: 0 });
      const found = res.all.find((i) => i.id === id) || res.items.find((i) => i.id === id);
      if (!found) {
        this.error.set('Non è tra i risultati di questa zona. Torna al radar e aggiorna.');
        return;
      }
      this.item.set(found);
    } catch {
      this.error.set('Dettaglio non disponibile.');
    }
  }

  async send(signal: string): Promise<void> {
    const it = this.item();
    if (!it) return;
    await this.api.feedback(it.id, signal);
    this.note.set('Registrato. Il prossimo giro ne tiene conto.');
  }
}
