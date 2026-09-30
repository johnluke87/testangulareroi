import { Pipe, PipeTransform } from '@angular/core';
import { weatherCodeDisplay } from '../weather-codes';

@Pipe({
  name: 'weatherLabel',
})
export class WeatherLabelPipe implements PipeTransform {
  transform(code: number): string {
    return weatherCodeDisplay(code).label;
  }
}
