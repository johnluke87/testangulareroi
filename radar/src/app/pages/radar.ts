import { Component, inject, signal } from '@angular/core';
import { Api } from '../core/api';
import { RadarPayload } from '../core/models';
import { Card } from '../shared/card';
import { Mappa, MapView } from '../shared/mappa';

@Component({
  selector: 'app-radar',
  imports: [Card, Mappa],
  template: `
    @if (loading()) {
      <div class="search-loader" role="status">
        <div class="spinner-border text-light"></div>
        <div>
          <strong>Ricerca in corso</strong>
          <p class="mb-0">Aspetta che finisca. I comandi sono bloccati.</p>
        </div>
      </div>
    }
    <div class="row g-3 mb-3">
      <div class="col-auto">
        <label class="form-label" for="quando">Quando</label>
        <input id="quando" class="form-control" type="date" [disabled]="loading()" [value]="day()" (change)="setDay($any($event.target).value)" />
      </div>
      <div class="col-auto">
        <label class="form-label" for="raggio">Raggio</label>
        <select id="raggio" class="form-select" [disabled]="loading()" [value]="radius()" (change)="setRadius(+$any($event.target).value)">
          <option value="10">10 km</option>
          <option value="15">15 km</option>
          <option value="25">25 km</option>
          <option value="40">40 km</option>
          <option value="50">50 km</option>
        </select>
      </div>
        <div class="col-12 col-md">
        <label class="form-label" for="dove">Dove</label>
        <div class="input-group">
          <input id="dove" class="form-control" placeholder="Paese o indirizzo" autocomplete="off" spellcheck="false" [disabled]="loading()" [value]="query()" (input)="onQuery($any($event.target).value)" (keydown.enter)="searchPlace()" />
          <button type="button" class="btn btn-dark" (click)="cerca()" [disabled]="loading()">Cerca</button>
          <button type="button" class="btn btn-dark" (click)="follow()" [disabled]="loading()">Qui</button>
        </div>
        @if (searching()) { <p class="text-secondary small mt-2 mb-0">Cerco suggerimenti…</p> }
        @if (places().length) {
          <div class="list-group mt-2">
            @for (p of places(); track p.label) {
              <button type="button" class="list-group-item list-group-item-action" [disabled]="loading()" (click)="pick(p)">{{ p.label }}</button>
            }
          </div>
        }
        @if (placeError()) { <p class="text-danger small mt-1 mb-0">{{ placeError() }}</p> }
      </div>
    </div>
    @if (error()) { <p class="text-danger">{{ error() }} <button type="button" class="btn btn-sm btn-outline-danger" (click)="load(true)">Riprova</button></p> }
    @if (data(); as d) {
      <header class="hero">
        <p class="kicker">{{ d.place_name || 'Intorno a te' }} · {{ d.radius_km }} km</p>
        <h1>{{ d.headline }}</h1>
        <p class="lead">{{ d.count }} cose trovate adesso. Te ne mostro poche.</p>
        @if (d.stale_reason) { <p class="warn">{{ d.stale_reason }}</p> }
        <p class="fine">Fonte: OpenStreetMap · aggiornato {{ d.fetched_at }} {{ d.live ? '· appena interrogato' : '· cache di poche ore' }}</p>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button type="button" class="btn btn-outline-secondary" (click)="follow()" [disabled]="loading()">Usa la mia posizione</button>
          <button type="button" class="btn btn-outline-secondary" (click)="cerca()" [disabled]="loading()">Cerca di nuovo</button>
        </div>
      </header>
      <app-mappa
        [latitude]="d.latitude"
        [longitude]="d.longitude"
        [originLatitude]="origin().latitude"
        [originLongitude]="origin().longitude"
        [radiusKm]="radius()"
        [recenter]="focus()"
        [items]="d.all"
        [locked]="loading()"
        (viewChange)="onMap($event)"
      />

      <section>
        <h2>Potrebbe interessarti</h2>
        <div class="grid">
          @for (item of d.sections.top; track item.id) { <app-card [item]="item" /> }
        </div>
      </section>
      <section>
        <h2>{{ d.weather.kind === 'bad' ? 'Se piove, meglio al coperto' : 'Se vuoi uscire' }}</h2>
        <div class="grid">
          @for (item of d.sections.out; track item.id) { <app-card [item]="item" /> }
        </div>
      </section>
      <section>
        <h2>Cose insolite</h2>
        <div class="grid">
          @for (item of d.sections.unusual; track item.id) { <app-card [item]="item" /> }
        </div>
      </section>
      @if (d.itinerary) {
        <section>
          <h2>{{ d.itinerary.title }}</h2>
          <p class="lead">{{ d.itinerary.note }} Circa {{ d.itinerary.minutes }} minuti in tutto.</p>
          <ol class="stops">
            @for (s of d.itinerary.stops; track s.id) {
              <li><app-card [item]="s" /></li>
            }
          </ol>
        </section>
      }
      <section>
        <h2>Per un tempo più lungo</h2>
        <div class="grid">
          @for (item of d.sections.weekend; track item.id) { <app-card [item]="item" /> }
        </div>
      </section>
    }
  `,
})
export class RadarPage {
  private api = inject(Api);
  day = signal(localToday());
  radius = signal(25);
  focus = signal(0);
  mapAt = signal<{ latitude: number; longitude: number } | null>(null);
  origin = signal<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  query = signal('');
  places = signal<{ label: string; latitude: number; longitude: number }[]>([]);
  searching = signal(false);
  placeError = signal('');
  private suggestWait = 0;
  private suggestSeq = 0;
  data = signal<RadarPayload | null>(null);
  loading = signal(false);
  error = signal('');
  private inFlight = false;
  private again = false;

  constructor() {
    const saved = this.api.user()?.radius_km;
    if (saved) this.radius.set(saved);
    const user = this.api.user();
    if (user?.latitude != null && user.longitude != null) {
      this.origin.set({ latitude: user.latitude, longitude: user.longitude });
    }
  }

  async load(fresh: boolean): Promise<void> {
    if (this.inFlight) {
      this.again = true;
      return;
    }
    this.inFlight = true;
    this.loading.set(true);
    this.error.set('');
    try {
      const here = this.mapAt();
      const start = this.origin();
      this.data.set(await this.api.radar({
        fresh: fresh ? 1 : undefined,
        ore: 4,
        day: this.day(),
        max_km: this.radius(),
        lat: here?.latitude,
        lng: here?.longitude,
        from_lat: start.latitude || undefined,
        from_lng: start.longitude || undefined,
      }));
    } catch (e: unknown) {
      const err = e as { error?: { error?: string } };
      this.error.set(err?.error?.error || 'Ricerca non riuscita.');
    } finally {
      this.inFlight = false;
      if (this.again) {
        this.again = false;
        void this.load(true);
      } else {
        this.loading.set(false);
      }
    }
  }

  setDay(value: string): void {
    if (!value) return;
    this.day.set(value);
  }

  async setRadius(km: number): Promise<void> {
    this.radius.set(km);
    const user = this.api.user();
    if (user?.latitude != null && user.longitude != null) {
      const res = await this.api.saveLocation({
        latitude: user.latitude,
        longitude: user.longitude,
        place_name: user.place_name ?? '',
        precision: (user.location_precision as 'gps' | 'manual') || 'manual',
        radius_km: km,
      });
      this.api.user.set(res.user);
    }
  }

  onQuery(value: string): void {
    this.query.set(value);
    window.clearTimeout(this.suggestWait);
    const q = value.trim();
    if (q.length < 3) {
      this.places.set([]);
      this.placeError.set('');
      return;
    }
    this.suggestWait = window.setTimeout(() => void this.searchPlace(), 350);
  }

  async searchPlace(): Promise<void> {
    const q = this.query().trim();
    if (q.length < 3) return;
    const seq = ++this.suggestSeq;
    this.searching.set(true);
    this.placeError.set('');
    try {
      const res = await this.api.geocode(q);
      if (seq !== this.suggestSeq) return;
      this.places.set(res.results);
      if (!res.results.length) this.placeError.set('Nessun posto trovato.');
    } catch {
      if (seq === this.suggestSeq) this.placeError.set('Ricerca non riuscita.');
    } finally {
      if (seq === this.suggestSeq) this.searching.set(false);
    }
  }

  async pick(p: { label: string; latitude: number; longitude: number }): Promise<void> {
    const user = this.api.user();
    const res = await this.api.saveLocation({
      latitude: p.latitude,
      longitude: p.longitude,
      place_name: p.label,
      precision: 'manual',
      radius_km: this.radius(),
    });
    this.api.user.set(res.user);
    this.origin.set({ latitude: p.latitude, longitude: p.longitude });
    this.places.set([]);
    this.query.set('');
    this.mapAt.set({ latitude: p.latitude, longitude: p.longitude });
    this.focus.update((n) => n + 1);
  }

  async cerca(): Promise<void> {
    await this.load(true);
  }

  onMap(view: MapView): void {
    if (this.loading()) return;
    this.radius.set(view.radiusKm);
    this.mapAt.set({ latitude: view.latitude, longitude: view.longitude });
  }

  follow(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const user = this.api.user();
      if (!user) return;
      const res = await this.api.saveLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        place_name: 'In giro adesso',
        precision: 'gps',
        radius_km: this.radius(),
      });
      this.api.user.set(res.user);
      this.origin.set({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      this.mapAt.set({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      this.focus.update((n) => n + 1);
    });
  }
}

function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
