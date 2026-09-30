import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { TracciatiHttp } from './tracciati-http';

/**
 * Interceptor funzionale: sta in mezzo a ogni richiesta HttpClient, anche a httpResource.
 * Non aggiunge header custom: un header non standard farebbe partire una preflight CORS
 * e DummyJSON la rifiuterebbe. Qui misuriamo solo il tempo.
 */
export const cronometroInterceptor: HttpInterceptorFn = (req, next) => {
  const tracciati = inject(TracciatiHttp);
  const inizio = performance.now();

  return next(req).pipe(
    tap({
      next: () => tracciati.registra(req.urlWithParams, performance.now() - inizio, true),
      error: () => tracciati.registra(req.urlWithParams, performance.now() - inizio, false),
    }),
  );
};
