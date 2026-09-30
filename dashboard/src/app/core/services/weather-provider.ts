import { Observable } from 'rxjs';
import { Forecast, Place } from '../../models/weather';

export abstract class WeatherProvider {
    abstract getForecast(place: Place): Observable<Forecast>;
}