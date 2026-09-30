import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Api } from './api';

async function ensureUser() {
  const api = inject(Api);
  const router = inject(Router);
  if (!api.token()) return router.createUrlTree(['/entra']);
  if (!api.user()) await api.restore();
  if (!api.user()) return router.createUrlTree(['/entra']);
  return true as const;
}

export const sessionGuard: CanActivateFn = () => ensureUser();

export const authGuard: CanActivateFn = async () => {
  const api = inject(Api);
  const router = inject(Router);
  const ok = await ensureUser();
  if (ok !== true) return ok;
  if (!api.user()?.onboarding_done || api.user()?.latitude == null) {
    return router.createUrlTree(['/inizio']);
  }
  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const api = inject(Api);
  const router = inject(Router);
  if (api.token() && !api.user()) await api.restore();
  if (api.user()?.latitude != null && api.user()?.onboarding_done) return router.createUrlTree(['/']);
  if (api.user()) return router.createUrlTree(['/inizio']);
  return true;
};
