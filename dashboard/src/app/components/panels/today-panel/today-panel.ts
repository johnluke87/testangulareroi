import { Component, computed, inject } from '@angular/core';
import { Clock } from '../../../core/services/clock';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-today-panel',
  imports: [DatePipe],
  templateUrl: './today-panel.html',
  styleUrl: './today-panel.scss',
})
export class TodayPanel {
  protected clock = inject(Clock);//inietta il servizio clock che c0è su corse/services/clock.ts

  greeting = computed(() => {
    const hour = this.clock.now().getHours();
    if (hour < 13) {
      return 'Buongiorno';
    }
    if (hour < 18) {
      return 'Buon pomeriggio';
    }
    return 'Buonasera';
  });
}
