import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NoteStore } from '../../core/note.store';

@Component({
  selector: 'app-note',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note.html',
})
export class NotePagina {
  protected readonly store = inject(NoteStore);
}
