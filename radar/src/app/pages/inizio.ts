import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from '../core/api';
import { PREFERENCES } from '../core/models';

@Component({
  selector: 'app-inizio',
  template: `
    <main class="sheet">
      <p class="brand">Radar</p>
      <h1>Dove guardi?</h1>
      <p class="lead">La posizione precisa resta su questo telefono se usi il GPS. Sul server salvo il punto solo per cercare intorno a te.</p>

      <div class="row">
        <button type="button" class="btn btn-primary" (click)="gps()" [disabled]="busy()">Usa la mia posizione</button>
        <label class="grow">Raggio
          <select class="form-select" [value]="radius()" (change)="radius.set(+$any($event.target).value)">
            <option value="15">15 km</option>
            <option value="25">25 km</option>
            <option value="40">40 km</option>
          </select>
        </label>
      </div>
      @if (gpsError()) { <p class="error">{{ gpsError() }}</p> }

      <form (submit)="search($event)">
        <label>Oppure paese o indirizzo
          <input class="form-control" name="q" placeholder="Volpago del Montello, via Roma 1…" />
        </label>
        <button type="submit" class="btn btn-outline-secondary" [disabled]="busy()">Cerca</button>
      </form>
      <ul class="places">
        @for (p of places(); track p.label) {
          <li class="mb-2"><button type="button" class="btn btn-light border w-100 text-start" (click)="choose(p.latitude, p.longitude, p.label, 'manual')">{{ p.label }}</button></li>
        }
      </ul>

      @if (step() === 'prefs') {
        <h2>Cosa ti piace trovare?</h2>
        <p class="lead">Puoi saltare. Il radar funziona comunque, e impara da quello che salvi o scarti.</p>
        <div class="checks">
          @for (p of prefs; track p.id) {
            <div class="border rounded-3 bg-white px-3 py-2 mb-2 d-flex align-items-center gap-2">
              <input class="form-check-input m-0" type="checkbox" [id]="'i-' + p.id" [checked]="selected().includes(p.id)" (change)="toggle(p.id)" />
              <label class="form-check-label mb-0" [for]="'i-' + p.id">{{ p.label }}</label>
            </div>
          }
        </div>
        <div class="d-flex gap-2 mt-3">
          <button type="button" class="btn btn-primary" (click)="finish(false)" [disabled]="busy()">Salva e apri</button>
          <button type="button" class="btn btn-outline-secondary" (click)="finish(true)">Salta</button>
        </div>
      }
      @if (error()) { <p class="error">{{ error() }}</p> }
    </main>
  `,
})
export class Inizio {
  private api = inject(Api);
  private router = inject(Router);
  prefs = PREFERENCES;
  radius = signal(25);
  places = signal<{ label: string; latitude: number; longitude: number }[]>([]);
  selected = signal<string[]>([]);
  step = signal<'place' | 'prefs'>('place');
  busy = signal(false);
  error = signal('');
  gpsError = signal('');

  toggle(id: string): void {
    const cur = this.selected();
    this.selected.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  gps(): void {
    this.gpsError.set('');
    if (!navigator.geolocation) {
      this.gpsError.set('Questo browser non dà la posizione.');
      return;
    }
    this.busy.set(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await this.choose(pos.coords.latitude, pos.coords.longitude, 'Posizione attuale', 'gps');
        this.busy.set(false);
      },
      () => {
        this.busy.set(false);
        this.gpsError.set('Posizione negata. Scrivi un paese.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async search(ev: Event): Promise<void> {
    ev.preventDefault();
    const q = String(new FormData(ev.target as HTMLFormElement).get('q') || '').trim();
    if (q.length < 2) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const res = await this.api.geocode(q);
      this.places.set(res.results);
      if (!res.results.length) this.error.set('Nessun posto trovato.');
    } catch {
      this.error.set('Ricerca indirizzo non riuscita.');
    } finally {
      this.busy.set(false);
    }
  }

  async choose(lat: number, lng: number, label: string, precision: 'gps' | 'approx' | 'manual'): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const res = await this.api.saveLocation({
        latitude: lat,
        longitude: lng,
        place_name: label,
        precision,
        radius_km: this.radius(),
      });
      this.api.user.set(res.user);
      this.step.set('prefs');
    } catch {
      this.error.set('Non sono riuscito a salvare la zona.');
    } finally {
      this.busy.set(false);
    }
  }

  async finish(skip: boolean): Promise<void> {
    this.busy.set(true);
    try {
      const res = await this.api.savePreferences(skip ? [] : this.selected(), true);
      this.api.user.set(res.user);
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('Preferenze non salvate.');
    } finally {
      this.busy.set(false);
    }
  }
}
