export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Place extends Coordinates {
    id: string;
    name: string;
    region?: string;
    country?: string;
}

export interface CurrentWeather { temperature: number; weatherCode: number; windSpeed: number; }

export interface HourlyForecast {
    time: Date;
    //giorno a cui appartiene l'ora, stesso formato di DailyForecast.date ('YYYY-MM-DD')
    day: string;
    temperature: number;
    weatherCode: number;
    precipitationProbability: number;
}

export interface DailyForecast {
    date: string;
    weatherCode: number;
    min: number;
    max: number;
    precipitationProbability: number;
    windSpeedMax: number;
    sunrise: Date;
    sunset: Date;
}

export interface Forecast {
    current: CurrentWeather;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
}
