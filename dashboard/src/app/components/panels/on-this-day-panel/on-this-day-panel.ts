import { Component, inject } from '@angular/core';
import { OnThisDay } from '../../../core/services/on-this-day';

/** "In questo giorno": cosa è successo oggi nella storia (Wikipedia). Cambia da solo a mezzanotte. */
@Component({
  selector: 'app-on-this-day-panel',
  templateUrl: './on-this-day-panel.html',
  styleUrl: './on-this-day-panel.scss',
})
export class OnThisDayPanel {
  protected history = inject(OnThisDay);
}
