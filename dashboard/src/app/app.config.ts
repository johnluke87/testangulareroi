import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { OpenMeteoWeather } from './core/services/open-meteo-weather';
import { WeatherProvider } from './core/services/weather-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: WeatherProvider, useClass: OpenMeteoWeather },
    provideBrowserGlobalErrorListeners(),
    //anchorScrolling: un link con fragment (es. /settings#giochi) scorre fino alla sezione con quell'id
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    { provide: LOCALE_ID, useValue: 'it' },
  ]
};
