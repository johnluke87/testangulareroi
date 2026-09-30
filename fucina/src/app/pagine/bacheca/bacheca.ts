import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { AttivitaStore } from '../../core/attivita.store';
import { NoteStore } from '../../core/note.store';
import { Pomodoro } from '../../core/pomodoro';
import { DurataPipe } from '../../shared/durata.pipe';

@Component({
  selector: 'app-bacheca',
  imports: [RouterLink, DatePipe, DurataPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bacheca.html',
})
export class Bacheca {
  protected readonly attivita = inject(AttivitaStore);
  protected readonly note = inject(NoteStore);
  protected readonly pomodoro = inject(Pomodoro);
  /** interval + takeUntilDestroyed: l'abbonamento muore con il componente. */
  protected readonly ora = signal(new Date());

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.ora.set(new Date()));
  }
}
