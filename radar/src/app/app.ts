import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from './core/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (api.user(); as u) {
      @if (u.onboarding_done && u.latitude != null) {
        <nav class="navbar navbar-expand bg-white border-bottom sticky-top">
          <div class="container gap-1 flex-nowrap overflow-auto">
            <a class="nav-link rounded-pill px-3" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Radar</a>
            <a class="nav-link rounded-pill px-3" routerLink="/oggi" routerLinkActive="active">Oggi</a>
            <a class="nav-link rounded-pill px-3" routerLink="/due-ore" routerLinkActive="active">2 ore</a>
            <a class="nav-link rounded-pill px-3" routerLink="/gratis" routerLinkActive="active">Gratis</a>
            <a class="nav-link rounded-pill px-3" routerLink="/sorprendimi" routerLinkActive="active">Sorprendimi</a>
            <a class="nav-link rounded-pill px-3" routerLink="/salvati" routerLinkActive="active">Salvati</a>
            <a class="nav-link rounded-pill px-3" routerLink="/notifiche" routerLinkActive="active">Avvisi</a>
            <a class="nav-link rounded-pill px-3" routerLink="/profilo" routerLinkActive="active">Tu</a>
          </div>
        </nav>
      }
    }
    <div class="container py-4">
      <router-outlet />
    </div>
  `,
})
export class App {
  api = inject(Api);
  constructor() {
    void this.api.restore();
  }
}
