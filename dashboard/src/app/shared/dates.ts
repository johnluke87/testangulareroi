import { formatDate } from '@angular/common';

// Le date "di calendario" (scadenza di un task, giorno del meteo) le teniamo come stringhe 'YYYY-MM-DD':
// non hanno ora né fuso orario, quindi il 2 ottobre resta il 2 ottobre ovunque.
// Queste funzioni convertono tra stringa e Date usando SEMPRE l'ora locale (mai toISOString, che è in UTC).

/** Date -> '2026-10-01' (ora locale). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** '2026-10-01' -> Date alla mezzanotte locale di quel giorno. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day); // i mesi di Date partono da 0
}

/** '2026-10-30' + 3 -> '2026-11-02' (Date gestisce da sola fine mese, anni bisestili, ora legale). */
export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Il prossimo lunedì dopo il giorno indicato (se è lunedì, quello della settimana dopo). */
export function nextMonday(key: string): string {
  const weekday = fromDateKey(key).getDay(); // 0 = domenica, 1 = lunedì, ... 6 = sabato
  const daysToAdd = (8 - weekday) % 7 || 7;
  return addDays(key, daysToAdd);
}

/** '2026-10-01' -> 'Oggi', 'Domani', 'Ieri' oppure la data nel formato indicato (es. 'ven 2'). */
export function relativeDayLabel(key: string, today: Date, format: string, locale: string): string {
  const days = Math.round((fromDateKey(key).getTime() - fromDateKey(toDateKey(today)).getTime()) / 86_400_000);
  if (days === 0) {
    return 'Oggi';
  }
  if (days === 1) {
    return 'Domani';
  }
  if (days === -1) {
    return 'Ieri';
  }
  return formatDate(fromDateKey(key), format, locale);
}
