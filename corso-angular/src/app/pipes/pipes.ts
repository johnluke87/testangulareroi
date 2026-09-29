import { Component } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { CurrencyPipe, DatePipe, DecimalPipe, I18nPluralPipe, I18nSelectPipe, LowerCasePipe, PercentPipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';

// I formati in italiano (currency con 'it', date in italiano) richiedono i dati della lingua.
// Senza questa riga: NG0701 Missing locale data for the locale "it".
registerLocaleData(localeIt);

@Component({
  selector: 'app-pipes',
  imports: [UpperCasePipe, LowerCasePipe, TitleCasePipe, SlicePipe, DatePipe, DecimalPipe, PercentPipe, CurrencyPipe, I18nSelectPipe, I18nPluralPipe],
  templateUrl: './pipes.html',
  styleUrl: './pipes.scss',
})
export class Pipes {
  oggi = new Date(2026, 8, 28, 15, 45, 30);
  importo = 1234.5;
  quota = 0.25;
  genere = 'donna';
  frasiGenere: Record<string, string> = {
    uomo: 'è un uomo',
    donna: 'è una donna',
    other: 'non è indicato',
  };
  quantita = 1;
  frasiQuantita: Record<string, string> = {
    '=0': 'nessun elemento',
    '=1': 'un elemento',
    other: '# elementi',
  };
}
