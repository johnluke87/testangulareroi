import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { Patto } from './patto';

/** Il componente che ha una bozza non salvata espone questo metodo. La guardia non conosce il form. */
export interface ConBozza {
  haModifiche(): boolean;
}

export const pattoGuard: CanActivateFn = () => {
  const patto = inject(Patto);
  const router = inject(Router);

  if (patto.accettato()) {
    return true;
  }

  return router.createUrlTree(['/patto']);
};

export const bozzaGuard: CanDeactivateFn<ConBozza> = (component) => {
  if (!component.haModifiche()) {
    return true;
  }

  return confirm('Hai modifiche non salvate. Uscire lo stesso?');
};
