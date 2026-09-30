import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from '../core/api';
import { PREFERENCES } from '../core/models';

@Component({
  selector: 'app-profilo',
  template: `
    <header class="hero">
      <h1>{{ api.user()?.name }}</h1>
      <p class="lead">{{ api.user()?.place_name }} · {{ api.user()?.radius_km }} km</p>
    </header>
    @if (stats(); as s) {
      <dl class="row g-2 mb-4">
        <div class="col-md-4"><div class="border rounded-3 bg-white p-3"><dt class="text-secondary small">Non le conoscevo</dt><dd class="h5 mb-0">{{ pct(s.discovery_rate) }}</dd></div></div>
        <div class="col-md-4"><div class="border rounded-3 bg-white p-3"><dt class="text-secondary small">Sorpresa utile</dt><dd class="h5 mb-0">{{ pct(s.surprise_rate) }}</dd></div></div>
        <div class="col-md-4"><div class="border rounded-3 bg-white p-3"><dt class="text-secondary small">Salvate o fatte</dt><dd class="h5 mb-0">{{ pct(s.action_rate) }}</dd></div></div>
      </dl>
    }
    <div class="row g-2 mb-3">
      @for (p of prefs; track p.id) {
        <div class="col-12 col-md-6 col-lg-4">
          <div class="form-check border rounded-3 bg-white px-3 py-2 mb-0 d-flex align-items-center gap-2">
            <input class="form-check-input m-0" type="checkbox" [id]="'p-' + p.id" [checked]="selected().includes(p.id)" (change)="toggle(p.id)" />
            <label class="form-check-label mb-0" [for]="'p-' + p.id">{{ p.label }}</label>
          </div>
        </div>
      }
    </div>
    <div class="d-flex flex-wrap gap-2">
      <button type="button" class="btn btn-primary" (click)="savePrefs()">Aggiorna gusti</button>
      <button type="button" class="btn btn-outline-secondary" (click)="goPlace()">Cambia zona</button>
      <button type="button" class="btn btn-link" (click)="logout()">Esci</button>
    </div>
    @if (note()) { <p class="pad">{{ note() }}</p> }
  `,
})
export class Profilo {
  api = inject(Api);
  private router = inject(Router);
  prefs = PREFERENCES;
  selected = signal<string[]>([...(this.api.user()?.interests ?? [])]);
  stats = signal<{ discovery_rate: number | null; surprise_rate: number | null; action_rate: number | null } | null>(null);
  note = signal('');
  constructor() { void this.api.stats().then((s) => this.stats.set(s)); }
  pct(v: number | null): string { return v == null ? '—' : Math.round(v * 100) + '%'; }
  toggle(id: string): void {
    const cur = this.selected();
    this.selected.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }
  async savePrefs(): Promise<void> {
    const res = await this.api.savePreferences(this.selected(), true);
    this.api.user.set(res.user);
    this.note.set('Gusti aggiornati.');
  }
  async goPlace(): Promise<void> {
    await this.router.navigateByUrl('/inizio');
  }
  logout(): void {
    this.api.logout();
    void this.router.navigateByUrl('/entra');
  }
}
