import { Pipe, PipeTransform } from '@angular/core';

// Pipe personalizzata: accorcia un testo lungo.
// Uso nel template: {{ descrizione | troncato }}  oppure  {{ descrizione | troncato:30:'...' }}
@Pipe({ name: 'troncato' })
export class Troncato implements PipeTransform {
  transform(valore: string | null | undefined, massimo = 20, fine = '…'): string {
    if (!valore) return '';
    if (valore.length <= massimo) return valore;
    return valore.slice(0, massimo).trimEnd() + fine;
  }
}
