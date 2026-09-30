import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly percorso = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: '/' },
  );

  protected readonly voci = [
    { path: '/bacheca', etichetta: 'Bacheca' },
    { path: '/attivita', etichetta: 'Attività' },
    { path: '/note', etichetta: 'Note' },
    { path: '/pomodoro', etichetta: 'Pomodoro' },
    { path: '/ricette', etichetta: 'Ricette' },
    { path: '/banco', etichetta: 'Banco' },
  ];
}
