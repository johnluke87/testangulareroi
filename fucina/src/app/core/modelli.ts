export type Priorita = 'bassa' | 'media' | 'alta';

export interface Attivita {
  id: string;
  titolo: string;
  priorita: Priorita;
  fatta: boolean;
  creataIl: string;
}

export interface Nota {
  id: string;
  titolo: string;
  corpo: string;
  etichette: string[];
  aggiornataIl: string;
}

export interface Ricetta {
  id: number;
  name: string;
  cuisine: string;
  difficulty: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  image: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  rating: number;
}

export interface RispostaRicette {
  recipes: Ricetta[];
  total: number;
}

export interface TracciaHttp {
  url: string;
  ms: number;
  ok: boolean;
}

export function nuovoId(): string {
  return crypto.randomUUID();
}
