export interface WeatherCodeDisplay {
  icon: string;
  label: string;
}

const WEATHER_CODES: { codes: number[]; icon: string; label: string }[] = [
  { codes: [0], icon: '☀️', label: 'Sereno' },
  { codes: [1], icon: '🌤️', label: 'Poco nuvoloso' },
  { codes: [2], icon: '⛅', label: 'Parzialmente nuvoloso' },
  { codes: [3], icon: '☁️', label: 'Coperto' },
  { codes: [45, 48], icon: '🌫️', label: 'Nebbia' },
  { codes: range(51, 57), icon: '🌦️', label: 'Pioviggine' },
  { codes: range(61, 67), icon: '🌧️', label: 'Pioggia' },
  { codes: range(71, 77), icon: '🌨️', label: 'Neve' },
  { codes: range(80, 82), icon: '🌦️', label: 'Rovesci' },
  { codes: [85, 86], icon: '🌨️', label: 'Rovesci di neve' },
  { codes: range(95, 99), icon: '⛈️', label: 'Temporale' },
];

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export function weatherCodeDisplay(code: number): WeatherCodeDisplay {
  const match = WEATHER_CODES.find((entry) => entry.codes.includes(code));
  return match ?? { icon: '❓', label: 'Sconosciuto' };
}
