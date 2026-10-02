import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { relativeDayLabel } from '../dates';

//'2026-10-01' -> 'Oggi', 'Domani' oppure 'ven 2' (con format 'EEEE d' -> 'venerdì 2')
//la logica sta in shared/dates.ts, così la usa anche la pipe dueLabel
@Pipe({
  name: 'relativeDay',
})
export class RelativeDayPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(date: string, today: Date, format = 'EEE d'): string {
    return relativeDayLabel(date, today, format, this.locale);
  }
}
