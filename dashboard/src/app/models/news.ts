// Notizie (dal nostro server, che legge i feed RSS dell'ANSA) e "In questo giorno" (da Wikipedia).

export interface NewsFeed {
  id: string;
  label: string;
}

export interface NewsItem {
  title: string;
  summary: string | null;
  /** sempre un articolo https://www.ansa.it/... (lo garantisce il server) */
  link: string;
  /** ISO in UTC, es. '2026-10-02T07:07:48Z' */
  publishedAt: string | null;
}

export interface NewsResponse {
  feed: string;
  items: NewsItem[];
}

/** Un evento di "In questo giorno", già semplificato per il pannello. */
export interface HistoryEvent {
  year: number;
  text: string;
  /** pagina Wikipedia dell'argomento principale */
  link: string | null;
  thumbnail: string | null;
  /** tra quelli "scelti" da Wikipedia per la pagina principale */
  highlighted: boolean;
}

export interface HistoryDay {
  events: HistoryEvent[];
  /** ricorrenze e feste del giorno (santi, giornate mondiali...) */
  holidays: string[];
}
