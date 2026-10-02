// I giochi come arrivano dal NOSTRO server (che li prende da BoardGameGeek e li trasforma in JSON).

/** Un gioco della lista "del momento" (hot list di BGG). */
export interface HotGame {
  id: number;
  rank: number;
  name: string;
  year: number | null;
  thumbnail: string | null;
}

/** Un gioco della tua collezione BGG. */
export interface CollectionGame {
  id: number;
  name: string;
  year: number | null;
  thumbnail: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  /** minuti */
  minTime: number | null;
  maxTime: number | null;
  /** media dei voti su BGG (1–10) */
  rating: number | null;
  /** il TUO voto, se l'hai dato */
  myRating: number | null;
  numPlays: number;
  /** peso/complessità su BGG, da 1 (leggero) a 5 (pesante); null se non lo sappiamo (ancora) */
  weight: number | null;
}

/**
 * Cosa dice il server sulla collezione:
 *  ok | no_username (non impostato nelle impostazioni) | pending (BGG la sta preparando) | invalid_username
 */
export type CollectionStatus = 'ok' | 'no_username' | 'pending' | 'invalid_username';

export interface GamesResponse<T> {
  status: CollectionStatus;
  games: T[];
  /** il server sta ancora scaricando il peso di alcuni giochi: richiedi tra qualche secondo */
  weightsPending?: boolean;
}

// --- Filtri di "Stasera" ---

/** I limiti dei cursori. Il massimo della durata vale "e oltre" (240 = anche giochi da 5 ore). */
export const FILTER_LIMITS = {
  minutes: { min: 0, max: 240, step: 15 },
  rating: { min: 1, max: 10, step: 0.5 },
  weight: { min: 1, max: 5, step: 0.5 },
} as const;

export interface GameFilters {
  players: number;
  minMinutes: number;
  maxMinutes: number;
  minRating: number;
  maxRating: number;
  minWeight: number;
  maxWeight: number;
  /** solo i giochi che non hai mai giocato */
  neverPlayed: boolean;
}

/** Filtri "aperti": tutto il range, quindi passa qualsiasi gioco (anche quelli senza dati). */
export const DEFAULT_FILTERS: GameFilters = {
  players: 4,
  minMinutes: FILTER_LIMITS.minutes.min,
  maxMinutes: FILTER_LIMITS.minutes.max,
  minRating: FILTER_LIMITS.rating.min,
  maxRating: FILTER_LIMITS.rating.max,
  minWeight: FILTER_LIMITS.weight.min,
  maxWeight: FILTER_LIMITS.weight.max,
  neverPlayed: false,
};

/**
 * Il gioco va bene con questi filtri?
 * Un dato che BGG non ha (null) passa solo se quel filtro è "aperto" (range completo):
 * se hai ristretto il peso, un gioco di cui non conosciamo il peso non te lo proponiamo.
 */
export function matchesFilters(game: CollectionGame, f: GameFilters): boolean {
  const playersOk =
    (game.minPlayers ?? 1) <= f.players && (f.players >= 8 ? (game.maxPlayers ?? 99) >= 8 : f.players <= (game.maxPlayers ?? 99));

  const duration = game.maxTime ?? game.minTime;
  const minutesOk = inRange(duration, f.minMinutes, f.maxMinutes, FILTER_LIMITS.minutes, true);
  const ratingOk = inRange(game.rating, f.minRating, f.maxRating, FILTER_LIMITS.rating, false);
  const weightOk = inRange(game.weight, f.minWeight, f.maxWeight, FILTER_LIMITS.weight, false);
  const playedOk = !f.neverPlayed || game.numPlays === 0;

  return playersOk && minutesOk && ratingOk && weightOk && playedOk;
}

function inRange(
  value: number | null,
  min: number,
  max: number,
  limits: { min: number; max: number },
  openEndedMax: boolean,
): boolean {
  const isOpen = min <= limits.min && max >= limits.max;
  if (value === null) {
    return isOpen;
  }
  // per la durata, il massimo del cursore significa "e oltre"
  const upperOk = (openEndedMax && max >= limits.max) || value <= max;
  return value >= min && upperOk;
}

/** "1.5–3", "1–5" ecc. */
export function rangeLabel(min: number, max: number, suffix = ''): string {
  return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`;
}

/** La pagina del gioco su BoardGameGeek. */
export function bggUrl(gameId: number): string {
  return `https://boardgamegeek.com/boardgame/${gameId}`;
}

/** "2–4 giocatori", "2 giocatori", "" se BGG non lo sa. */
export function playersLabel(game: CollectionGame): string {
  const { minPlayers: min, maxPlayers: max } = game;
  if (!min && !max) {
    return '';
  }
  return min === max || !max ? `${min} giocatori` : `${min ?? 1}–${max} giocatori`;
}

/** "30–60 min", "45 min", "" se BGG non lo sa. */
export function timeLabel(game: CollectionGame): string {
  const { minTime: min, maxTime: max } = game;
  if (!min && !max) {
    return '';
  }
  return min === max || !min || !max ? `${max ?? min} min` : `${min}–${max} min`;
}
