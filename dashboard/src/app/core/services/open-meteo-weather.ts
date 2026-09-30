import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Forecast, Place } from '../../models/weather';
import { WeatherProvider } from './weather-provider';

//risposta di Open-Meteo: current è un oggetto, hourly e daily sono a colonne (stesso indice = stessa ora/giorno)
interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

@Injectable()
export class OpenMeteoWeather extends WeatherProvider {
  private http = inject(HttpClient);

  getForecast(place: Place): Observable<Forecast> {
    return this.http
      .get<OpenMeteoResponse>('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: place.latitude,
          longitude: place.longitude,
          current: 'temperature_2m,weather_code,wind_speed_10m',
          hourly: 'temperature_2m,weather_code,precipitation_probability',
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,' +
            'wind_speed_10m_max,sunrise,sunset',
          //orari senza 'Z': new Date() li legge come ora locale, quindi chiediamo l'ora italiana
          timezone: 'Europe/Rome',
          forecast_days: 7,
        },
      })
      .pipe(map((raw) => this.toForecast(raw)));
  }

  //tutte le ore dei 7 giorni: quali mostrare lo decide il componente in base al giorno scelto
  private toForecast(raw: OpenMeteoResponse): Forecast {
    return {
      current: {
        temperature: raw.current.temperature_2m,
        weatherCode: raw.current.weather_code,
        windSpeed: raw.current.wind_speed_10m,
      },
      hourly: raw.hourly.time.map((t, i) => ({
        time: new Date(t),
        day: t.slice(0, 10),
        temperature: raw.hourly.temperature_2m[i],
        weatherCode: raw.hourly.weather_code[i],
        precipitationProbability: raw.hourly.precipitation_probability[i],
      })),
      daily: raw.daily.time.map((date, i) => ({
        date,
        weatherCode: raw.daily.weather_code[i],
        min: raw.daily.temperature_2m_min[i],
        max: raw.daily.temperature_2m_max[i],
        precipitationProbability: raw.daily.precipitation_probability_max[i],
        windSpeedMax: raw.daily.wind_speed_10m_max[i],
        sunrise: new Date(raw.daily.sunrise[i]),
        sunset: new Date(raw.daily.sunset[i]),
      })),
    };
  }
}
