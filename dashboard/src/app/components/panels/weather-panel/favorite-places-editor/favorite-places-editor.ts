import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { FavoritePlaces } from '../../../../core/services/favorite-places';
import { Geocoding } from '../../../../core/services/geocoding';
import { Place } from '../../../../models/weather';

const MIN_QUERY_LENGTH = 2;

@Component({
  selector: 'app-favorite-places-editor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './favorite-places-editor.html',
  styleUrl: './favorite-places-editor.scss',
})
export class FavoritePlacesEditor {
  private geocoding = inject(Geocoding);
  protected favorites = inject(FavoritePlaces);

  protected search = new FormControl('', { nonNullable: true });

  //aspetta che smetti di scrivere, e se scrivi ancora annulla la ricerca precedente (switchMap)
  protected results = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(300),
      map((text) => text.trim()),
      distinctUntilChanged(),
      switchMap((text) =>
        text.length < MIN_QUERY_LENGTH
          ? of(null)
          : this.geocoding.search(text).pipe(catchError(() => of([] as Place[]))),
      ),
    ),
    { initialValue: null },
  );

  protected add(place: Place): void {
    this.favorites.add(place);
    this.search.setValue('');
  }

  protected drop(event: CdkDragDrop<Place[]>): void {
    this.favorites.move(event.previousIndex, event.currentIndex);
  }
}
