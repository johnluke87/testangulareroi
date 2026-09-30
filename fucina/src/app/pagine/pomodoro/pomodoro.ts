import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Pomodoro } from '../../core/pomodoro';
import { DurataPipe } from '../../shared/durata.pipe';

@Component({
  selector: 'app-pomodoro',
  imports: [DurataPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pomodoro.html',
})
export class PomodoroPagina {
  protected readonly pomodoro = inject(Pomodoro);
}
