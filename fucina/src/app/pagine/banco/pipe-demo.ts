import { CurrencyPipe, DatePipe, JsonPipe, LowerCasePipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DurataPipe } from '../../shared/durata.pipe';

@Component({
  selector: 'app-pipe-demo',
  imports: [DatePipe, CurrencyPipe, SlicePipe, TitleCasePipe, LowerCasePipe, JsonPipe, DurataPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pipe-demo.html',
})
export class PipeDemo {
  protected readonly adesso = signal(new Date());
  protected readonly scheda = signal({ nome: 'fucina', pezzi: 3 });
}
