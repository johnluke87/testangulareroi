import { DurataPipe } from './durata.pipe';

describe('DurataPipe', () => {
  const pipe = new DurataPipe();

  it('formatta minuti e secondi', () => {
    expect(pipe.transform(65)).toBe('1:05');
    expect(pipe.transform(0)).toBe('0:00');
    expect(pipe.transform(null)).toBe('0:00');
  });
});
