import { Troncato } from './troncato';

// Una pipe è una classe normale: si prova senza TestBed, chiamando transform.
describe('Troncato', () => {
  const pipe = new Troncato();

  it('lascia invariato un testo corto', () => {
    expect(pipe.transform('Angular')).toBe('Angular');
  });

  it('accorcia un testo lungo e aggiunge i puntini', () => {
    expect(pipe.transform('Corso completo di Angular 21', 10)).toBe('Corso comp…');
  });

  it('usa la fine scelta e toglie lo spazio prima', () => {
    expect(pipe.transform('Signal e zoneless', 7, '...')).toBe('Signal...');
  });

  it('restituisce stringa vuota per null e undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
