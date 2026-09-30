/** Lettura e scrittura JSON su localStorage. Non è un service: è una funzione pura. */

export function caricaJson<T>(chiave: string, seme: () => T): T {
  if (typeof localStorage === 'undefined') {
    return seme();
  }

  const grezzo = localStorage.getItem(chiave);
  if (grezzo === null) {
    return seme();
  }

  try {
    return JSON.parse(grezzo) as T;
  } catch {
    return seme();
  }
}

export function salvaJson(chiave: string, valore: unknown): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(chiave, JSON.stringify(valore));
}
