import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Evidenzia } from '../../shared/evidenzia';

@Component({
  selector: 'app-direttive-demo',
  imports: [Evidenzia],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './direttive-demo.html',
})
export class DirettiveDemo {
  protected readonly acceso = signal(true);
  protected readonly tinta = signal('#234237');
}
