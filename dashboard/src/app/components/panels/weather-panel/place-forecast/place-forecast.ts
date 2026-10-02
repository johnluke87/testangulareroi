import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Place } from '../../../../models/weather';
import { Clock } from '../../../../core/services/clock';
import { WeatherProvider } from '../../../../core/services/weather-provider';
import { RelativeDayPipe } from '../../../../shared/pipes/relative-day-pipe';
import { WeatherIconPipe } from '../../../../shared/pipes/weather-icon-pipe';
import { WeatherLabelPipe } from '../../../../shared/pipes/weather-label-pipe';

const ONE_HOUR_MS = 60 * 60 * 1000;

@Component({
  selector: 'app-place-forecast',
  imports: [DatePipe, DecimalPipe, RelativeDayPipe, WeatherIconPipe, WeatherLabelPipe],
  templateUrl: './place-forecast.html',
  styleUrl: './place-forecast.scss',
})
export class PlaceForecast {
  place = input.required<Place>();
  //true per la località trovata con la geolocalizzazione
  isCurrent = input(false);

  private weather = inject(WeatherProvider);
  protected clock = inject(Clock);

  forecast = rxResource({
    params: () => this.place(),
    stream: ({ params }) => this.weather.getForecast(params),
  });

  //indice del giorno scelto: un signal normale, quindi RESTA lo stesso quando cambi località
  //(prima era un linkedSignal che tornava a "oggi" a ogni cambio di località)
  protected selectedDayIndex = signal(0);

  //le previsioni da mostrare: undefined mentre carica o se c'è un errore (value() in errore lancerebbe)
  protected data = computed(() =>
    !this.forecast.isLoading() && this.forecast.hasValue() ? this.forecast.value() : undefined,
  );

  protected selectedDay = computed(() =>
    this.forecast.hasValue() ? this.forecast.value().daily[this.selectedDayIndex()] : undefined,
  );

  //le ore del giorno scelto; per oggi solo da quella in corso in poi
  protected selectedHours = computed(() => {
    const day = this.selectedDay();
    if (!day || !this.forecast.hasValue()) {
      return [];
    }
    const fromTime = new Date(this.clock.now().getTime() - ONE_HOUR_MS);
    return this.forecast
      .value()
      .hourly.filter((h) => h.day === day.date && (this.selectedDayIndex() > 0 || h.time > fromTime));
  });
}
