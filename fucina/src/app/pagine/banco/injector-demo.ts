import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { API_RICETTE } from '../../core/api-ricette';
import { Patto } from '../../core/patto';

/** Senza providedIn: esiste solo dove un componente lo mette in `providers`. */
@Injectable()
export class ContatoreLocale {
  readonly n = signal(0);
  incrementa(): void {
    this.n.update((valore) => valore + 1);
  }
}

@Component({
  selector: 'app-banco-locale',
  providers: [ContatoreLocale],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <p>Istanza locale: {{ contatore.n() }}</p>
      <button type="button" (click)="contatore.incrementa()">+1 solo qui</button>
      <small>Token API: {{ api }}</small>
    </article>
  `,
})
export class BancoLocale {
  protected readonly contatore = inject(ContatoreLocale);
  protected readonly api = inject(API_RICETTE);
}

@Component({
  selector: 'app-injector-demo',
  imports: [BancoLocale],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './injector-demo.html',
})
export class InjectorDemo {
  private readonly patto = inject(Patto);
  private readonly router = inject(Router);

  dimentica(): void {
    this.patto.dimentica();
    void this.router.navigate(['/bacheca']);
  }
}
