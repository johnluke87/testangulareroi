import { moveItemInArray } from '@angular/cdk/drag-drop';
import { effect, Injectable, signal } from '@angular/core';
import { Place } from '../../models/weather';

const STORAGE_KEY = 'dashboard.favoritePlaces';

const DEFAULT_PLACES: Place[] = [
  { id: 'roma', name: 'Roma', region: 'Lazio', latitude: 41.9028, longitude: 12.4964 },
  { id: 'milano', name: 'Milano', region: 'Lombardia', latitude: 45.4642, longitude: 9.19 },
];

@Injectable({
  providedIn: 'root',
})
export class FavoritePlaces {
  //scrivibile solo da qui dentro, fuori si legge soltanto
  private readonly list = signal<Place[]>(loadPlaces());
  readonly places = this.list.asReadonly();

  constructor() {
    //ogni volta che la lista cambia, la salvo nel browser
    effect(() => savePlaces(this.list()));
  }

  has(id: string): boolean {
    return this.list().some((p) => p.id === id);
  }

  add(place: Place): void {
    if (!this.has(place.id)) {
      this.list.update((places) => [...places, place]);
    }
  }

  remove(id: string): void {
    this.list.update((places) => places.filter((p) => p.id !== id));
  }

  toggle(place: Place): void {
    if (this.has(place.id)) {
      this.remove(place.id);
    } else {
      this.add(place);
    }
  }

  move(fromIndex: number, toIndex: number): void {
    this.list.update((places) => {
      const copy = [...places];
      moveItemInArray(copy, fromIndex, toIndex);
      return copy;
    });
  }
}

//localStorage può non esserci o lanciare eccezioni (navigazione privata, dati bloccati)
function loadPlaces(): Place[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Place[]) : DEFAULT_PLACES;
  } catch {
    return DEFAULT_PLACES;
  }
}

function savePlaces(places: Place[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch {
    //se non si può salvare, la lista vale solo fino alla chiusura della scheda
  }
}
