import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-banco',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banco.html',
})
export class Banco {
  protected readonly voci = [
    { path: 'direttive', etichetta: 'Direttive' },
    { path: 'pipe', etichetta: 'Pipe' },
    { path: 'defer', etichetta: '@defer' },
    { path: 'proiezione', etichetta: 'Proiezione' },
    { path: 'injector', etichetta: 'Injector' },
    { path: 'ciclo', etichetta: 'Ciclo di vita' },
  ];
}
