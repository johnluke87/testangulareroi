import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

//'2026-10-01' -> 'Oggi', 'Domani' oppure 'ven 2' (con format 'EEEE d' -> 'venerdì 2')
@Pipe({
  name: 'relativeDay',
})
export class RelativeDayPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(date: string, today: Date, format = 'EEE d'): string {
    const [year, month, day] = date.split('-').map(Number);
    const target = new Date(year, month - 1, day);

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const days = Math.round((target.getTime() - startOfToday.getTime()) / MS_PER_DAY);
    if (days === 0) {
      return 'Oggi';
    }
    if (days === 1) {
      return 'Domani';
    }
    return formatDate(target, format, this.locale);
  }
}
