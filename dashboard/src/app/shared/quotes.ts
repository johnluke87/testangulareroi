export interface DailyQuote {
  text: string;
  author: string;
}

const QUOTES: DailyQuote[] = [
  { text: 'Chi va piano va sano e va lontano.', author: 'Proverbio' },
  { text: 'Non è mai troppo tardi per diventare ciò che avresti potuto essere.', author: 'George Eliot' },
  { text: 'Il modo migliore per predire il futuro è crearlo.', author: 'Peter Drucker' },
  { text: 'Fai quello che puoi, con quello che hai, dove sei.', author: 'Theodore Roosevelt' },
  { text: 'La semplicità è la sofisticazione suprema.', author: 'Leonardo da Vinci' },
  { text: 'Chi non rischia non rosica.', author: 'Proverbio' },
  { text: 'Ogni lungo viaggio comincia con un piccolo passo.', author: 'Lao Tzu' },
  { text: 'Meglio un giorno da leone che cento da pecora.', author: 'Proverbio' },
  { text: 'La fortuna aiuta gli audaci.', author: 'Virgilio' },
  { text: 'Impara come se dovessi vivere per sempre.', author: 'Gandhi' },
  { text: 'Non contare i giorni: fai in modo che i giorni contino.', author: 'Muhammad Ali' },
  { text: 'Chi dorme non piglia pesci.', author: 'Proverbio' },
  { text: 'La pazienza è amara, ma il suo frutto è dolce.', author: 'Aristotele' },
  { text: 'Sbagliando si impara.', author: 'Proverbio' },
];

/** Stessa frase per tutto il giorno locale, un'altra a mezzanotte. */
export function quoteForDate(date: Date): DailyQuote {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[((day % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
