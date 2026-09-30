import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Contatore } from '../../shared/contatore';
import { Scheda } from '../../shared/scheda';

@Component({
  selector: 'app-proiezione-demo',
  imports: [Scheda, Contatore, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './proiezione-demo.html',
})
export class ProiezioneDemo {
  protected readonly n = signal(1);
  protected readonly nome = signal('Fucina');
}
