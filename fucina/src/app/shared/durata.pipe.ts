import { Pipe, PipeTransform } from '@angular/core';

/** Pipe pura: ricalcola solo se il numero in ingresso cambia. */
@Pipe({ name: 'durata' })
export class DurataPipe implements PipeTransform {
  transform(secondi: number | null | undefined): string {
    const totale = Math.max(0, Math.floor(secondi ?? 0));
    const minuti = Math.floor(totale / 60);
    const resto = totale % 60;
    return `${minuti}:${resto.toString().padStart(2, '0')}`;
  }
}
