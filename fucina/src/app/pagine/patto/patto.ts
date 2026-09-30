import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Patto } from '../../core/patto';

@Component({
  selector: 'app-patto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patto.html',
})
export class PattoPagina {
  private readonly patto = inject(Patto);
  private readonly router = inject(Router);

  accetta(): void {
    this.patto.accetta();
    void this.router.navigate(['/banco']);
  }
}
