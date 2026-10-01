import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
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
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'it' },
  ]
};
