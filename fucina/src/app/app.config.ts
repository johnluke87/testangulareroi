import { LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import localeIt from '@angular/common/locales/it';
import { cronometroInterceptor } from './core/cronometro.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeIt);

/**
 * Configurazione dell'app, al posto di AppModule.
 * Zoneless: i signal aggiornano la vista da soli, senza zone.js.
 */
export const appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([cronometroInterceptor])),
    { provide: LOCALE_ID, useValue: 'it' },
  ],
};
