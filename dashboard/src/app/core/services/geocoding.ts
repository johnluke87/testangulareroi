import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Coordinates, Place } from '../../models/weather';

//Open-Meteo: da nome a coordinate. Se non trova niente, "results" non c'è proprio
interface OpenMeteoGeocodingResponse {
  results?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
    country_code?: string;
  }[];
}

const PREFERRED_COUNTRY = 'IT';

//BigDataCloud: da coordinate a nome (Open-Meteo non lo fa)
interface ReverseGeocodingResponse {
  city: string;
  locality: string;
  principalSubdivision: string;
  countryName: string;
}

@Injectable({
  providedIn: 'root',
})
export class Geocoding {
  private http = inject(HttpClient);

  search(query: string): Observable<Place[]> {
    return this.http
      .get<OpenMeteoGeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', {
        params: { name: query, count: 10, language: 'it' },
      })
      .pipe(
        map((raw) =>
          [...(raw.results ?? [])]
            //prima le località italiane, poi le altre (sort è stabile: l'ordine per rilevanza resta)
            .sort(
              (a, b) =>
                Number(b.country_code === PREFERRED_COUNTRY) - Number(a.country_code === PREFERRED_COUNTRY),
            )
            .map((r) => ({
              id: String(r.id),
              name: r.name,
              latitude: r.latitude,
              longitude: r.longitude,
              region: r.admin1,
              country: r.country,
            })),
        ),
      );
  }

  //non fallisce mai: se il servizio non risponde, la posizione si chiama "Posizione attuale"
  placeAt(coords: Coordinates): Observable<Place> {
    const fallback: Place = { ...coords, id: placeIdFor(coords), name: 'Posizione attuale' };

    return this.http
      .get<ReverseGeocodingResponse>('https://api.bigdatacloud.net/data/reverse-geocode-client', {
        params: { ...coords, localityLanguage: 'it' },
      })
      .pipe(
        map((raw) => ({
          ...fallback,
          name: raw.city || raw.locality || fallback.name,
          region: raw.principalSubdivision || undefined,
          country: raw.countryName || undefined,
        })),
        catchError(() => of(fallback)),
      );
  }
}

//id stabile per un punto (circa 1 km), così la posizione attuale si può mettere nei preferiti
function placeIdFor(coords: Coordinates): string {
  return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
}
