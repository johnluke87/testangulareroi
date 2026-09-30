import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Opportunity, RadarPayload, User } from './models';

const TOKEN_KEY = 'radar_token';

@Injectable({ providedIn: 'root' })
export class Api {
  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = this.token();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}`, 'X-Radar-Token': token })
      : new HttpHeaders();
  }

  private async req<T>(method: string, url: string, body?: unknown): Promise<T> {
    return firstValueFrom(
      this.http.request<T>(method, '/api' + url, { body, headers: this.headers() }),
    );
  }

  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
    this.user.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  async restore(): Promise<void> {
    if (!this.token()) return;
    try {
      const res = await this.req<{ user: User }>('GET', '/me');
      this.user.set(res.user);
    } catch {
      this.logout();
    }
  }

  register(name: string, email: string, password: string) {
    return this.req<{ token: string; user: User }>('POST', '/auth/register', { name, email, password });
  }

  login(email: string, password: string) {
    return this.req<{ token: string; user: User }>('POST', '/auth/login', { email, password });
  }

  geocode(q: string) {
    return this.req<{ results: { label: string; latitude: number; longitude: number }[] }>(
      'GET',
      '/geocode?q=' + encodeURIComponent(q),
    );
  }

  saveLocation(payload: {
    latitude: number;
    longitude: number;
    place_name: string;
    precision: 'gps' | 'approx' | 'manual';
    radius_km: number;
  }) {
    return this.req<{ user: User }>('PUT', '/me/location', payload);
  }

  savePreferences(categories: string[], skip = false) {
    return this.req<{ user: User }>('PUT', '/me/preferences', { categories, skip });
  }

  saveNotify(digest: boolean, instant: boolean) {
    return this.req<{ user: User }>('PUT', '/me/notify', { digest, instant });
  }

  radar(params: Record<string, string | number | boolean | undefined>) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    const s = q.toString();
    return this.req<RadarPayload>('GET', '/radar' + (s ? '?' + s : ''));
  }

  feedback(id: number, signal: string) {
    return this.req<{ ok: boolean }>('POST', `/opportunita/${id}/feedback`, { signal });
  }

  saved() {
    return this.req<{ items: Opportunity[] }>('GET', '/salvati');
  }

  notifications() {
    return this.req<{ items: { id: number; title: string; body: string; kind: string; read_at: string | null; opportunity_id: number | null; created_at: string }[] }>(
      'GET',
      '/notifiche',
    );
  }

  readNotification(id: number) {
    return this.req('POST', `/notifiche/${id}/letta`);
  }

  dismissNotification(id: number) {
    return this.req('POST', `/notifiche/${id}/nascondi`);
  }

  stats() {
    return this.req<{ discovery_rate: number | null; surprise_rate: number | null; action_rate: number | null }>('GET', '/stats');
  }
}
