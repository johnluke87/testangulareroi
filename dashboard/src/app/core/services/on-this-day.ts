import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HistoryDay, HistoryEvent } from '../../models/news';
import { toDateKey } from '../../shared/dates';
import { Clock } from './clock';

// Il "feed" pubblico di Wikipedia in italiano. Permette le chiamate dirette dal browser (CORS aperto),
// quindi qui NON passiamo dal nostro server: nessun dato personale, niente da proteggere.
const WIKIPEDIA_FEED = 'https://it.wikipedia.org/api/rest_v1/feed/onthisday/all';
const WIKIPEDIA_PAGE_PREFIX = 'https://it.wikipedia.org/';

/** Come risponde Wikipedia (solo i campi che usiamo). */
interface WikipediaEvent {
  year?: number;
  text: string;
  pages?: { content_urls?: { desktop?: { page?: string } }; thumbnail?: { source?: string } }[];
}
interface WikipediaOnThisDay {
  selected?: WikipediaEvent[];
  events?: WikipediaEvent[];
  holidays?: WikipediaEvent[];
}

/** "In questo giorno": cosa è successo oggi nella storia. */
@Injectable({
  providedIn: 'root',
})
export class OnThisDay {
  private http = inject(HttpClient);
  private clock = inject(Clock);

  /** '10/02' (mese/giorno): cambia solo a mezzanotte, ed è il params della risorsa -> si aggiorna da sola ogni mattina. */
  private monthDay = computed(() => {
    const [, month, day] = toDateKey(this.clock.now()).split('-');
    return `${month}/${day}`;
  });

  readonly day = rxResource({
    params: () => this.monthDay(),
    stream: ({ params }) =>
      this.http.get<WikipediaOnThisDay>(`${WIKIPEDIA_FEED}/${params}`).pipe(map((raw) => toHistoryDay(raw))),
  });

  readonly value = computed<HistoryDay | undefined>(() => (this.day.hasValue() ? this.day.value() : undefined));
}

/** Prima gli eventi "scelti" (con foto), poi gli altri dal più recente; senza doppioni. */
function toHistoryDay(raw: WikipediaOnThisDay): HistoryDay {
  const highlighted = (raw.selected ?? []).map((e) => toEvent(e, true));
  const seen = new Set(highlighted.map((e) => e.text));
  const others = (raw.events ?? [])
    .map((e) => toEvent(e, false))
    .filter((e) => !seen.has(e.text))
    .sort((a, b) => b.year - a.year);

  return {
    events: [...highlighted, ...others],
    holidays: (raw.holidays ?? []).map((h) => h.text).slice(0, 3),
  };
}

function toEvent(raw: WikipediaEvent, highlighted: boolean): HistoryEvent {
  const page = raw.pages?.[0];
  const link = page?.content_urls?.desktop?.page ?? null;
  return {
    year: raw.year ?? 0,
    text: raw.text,
    // il link finisce in un <a href>: solo pagine di it.wikipedia.org
    link: link?.startsWith(WIKIPEDIA_PAGE_PREFIX) ? link : null,
    thumbnail: highlighted ? (page?.thumbnail?.source ?? null) : null,
    highlighted,
  };
}
