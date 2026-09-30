import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';
import { DeviceLocation } from '../../../core/services/device-location';
import { FavoritePlaces } from '../../../core/services/favorite-places';
import { Geocoding } from '../../../core/services/geocoding';
import { Place } from '../../../models/weather';
import { FavoritePlacesEditor } from './favorite-places-editor/favorite-places-editor';
import { PlaceForecast } from './place-forecast/place-forecast';

@Component({
  selector: 'app-weather-panel',
  imports: [PlaceForecast, FavoritePlacesEditor, MatButtonModule, MatIconModule],
  templateUrl: './weather-panel.html',
  styleUrl: './weather-panel.scss',
})
export class WeatherPanel {
  private deviceLocation = inject(DeviceLocation);
  private geocoding = inject(Geocoding);
  protected favorites = inject(FavoritePlaces);

  protected editing = signal(false);

  //prima le coordinate dal browser, poi il nome del posto
  protected currentPlace = rxResource({
    stream: () =>
      this.deviceLocation.getPosition().pipe(switchMap((coords) => this.geocoding.placeAt(coords))),
  });

  protected locationError = computed(() => {
    const error = this.currentPlace.error();
    if (!error) {
      return null;
    }
    //GeolocationPositionError.PERMISSION_DENIED
    if ((error as Partial<GeolocationPositionError>).code === 1) {
      return 'Permesso negato: consenti la posizione dall\'icona nella barra degli indirizzi';
    }
    return 'Posizione non disponibile';
  });

  protected here = computed(() => (this.currentPlace.hasValue() ? this.currentPlace.value() : undefined));

  //posizione attuale per prima, poi i preferiti (senza doppioni se hai messo la stella alla posizione)
  protected places = computed<Place[]>(() => {
    const here = this.here();
    const favorites = this.favorites.places();
    return here ? [here, ...favorites.filter((p) => p.id !== here.id)] : favorites;
  });

  //null = nessuna scelta fatta: vale la prima della lista, cioè la tua posizione
  private chosenId = signal<string | null>(null);

  //undefined se non c'è nessuna località (niente posizione e nessun preferito)
  protected selectedPlace = computed<Place | undefined>(() => {
    const places = this.places();
    return places.find((p) => p.id === this.chosenId()) ?? places[0];
  });

  protected select(place: Place): void {
    this.chosenId.set(place.id);
  }
}
