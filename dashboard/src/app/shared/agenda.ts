import { CalendarEvent } from '../models/agenda';
import { addDays, fromDateKey, toDateKey } from './dates';

/** Un evento pronto per il pannello, con quello che serve per evidenziarlo. */
export interface AgendaItem extends CalendarEvent {
  /** già finito (lo mostro più chiaro) */
  past: boolean;
  /** in corso adesso */
  ongoing: boolean;
  /** inizia entro un'ora: tra quanti minuti; altrimenti null */
  startsInMinutes: number | null;
}

export interface AgendaDay {
  /** 'YYYY-MM-DD' */
  key: string;
  items: AgendaItem[];
}

const MS_PER_MINUTE = 60_000;
const SOON_MINUTES = 60;

/**
 * Raggruppa gli eventi per giorno, da oggi per `days` giorni. Restituisce solo i giorni che hanno eventi.
 * Un evento compare in OGNI giorno che tocca (es. una vacanza di 3 giorni "tutto il giorno", o una cena
 * che finisce dopo mezzanotte). Funzione pura: stessi dati in ingresso -> stesso risultato.
 */
export function buildAgenda(events: CalendarEvent[], now: Date, days: number): AgendaDay[] {
  const todayKey = toDateKey(now);
  const nowMs = now.getTime();
  const result: AgendaDay[] = [];

  for (let i = 0; i < days; i++) {
    const key = addDays(todayKey, i);
    const dayStart = fromDateKey(key).getTime();
    const dayEnd = fromDateKey(addDays(key, 1)).getTime();

    const items = events
      .map((event) => ({ event, ...interval(event) }))
      // si sovrappone a questo giorno? (inizia prima che il giorno finisca E finisce dopo che è iniziato)
      .filter(({ start, end }) => start < dayEnd && end > dayStart)
      .sort((a, b) => Number(b.event.allDay) - Number(a.event.allDay) || a.start - b.start)
      .map(({ event, start, end }) => ({
        ...event,
        past: !event.allDay && end <= nowMs,
        ongoing: !event.allDay && start <= nowMs && nowMs < end,
        startsInMinutes:
          !event.allDay && start > nowMs && start - nowMs <= SOON_MINUTES * MS_PER_MINUTE
            ? Math.round((start - nowMs) / MS_PER_MINUTE)
            : null,
      }));

    if (items.length > 0) {
      result.push({ key, items });
    }
  }
  return result;
}

/** Inizio e fine in millisecondi. Per "tutto il giorno": dalla mezzanotte locale (la fine è già esclusa da Google). */
function interval(event: CalendarEvent): { start: number; end: number } {
  return event.allDay
    ? { start: fromDateKey(event.start).getTime(), end: fromDateKey(event.end).getTime() }
    : { start: Date.parse(event.start), end: Date.parse(event.end) };
}
