import { Pipe, PipeTransform } from '@angular/core';
import { weatherCodeDisplay } from '../weather-codes';

@Pipe({
  name: 'weatherIcon',
})
export class WeatherIconPipe implements PipeTransform {
  transform(code: number): string {
    return weatherCodeDisplay(code).icon;
  }
}
