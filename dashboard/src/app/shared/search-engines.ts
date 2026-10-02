export const SEARCH_ENGINES = [
  { id: 'google', label: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { id: 'bing', label: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'ecosia', label: 'Ecosia', url: 'https://www.ecosia.org/search?q=' },
  { id: 'brave', label: 'Brave', url: 'https://search.brave.com/search?q=' },
] as const;

export type SearchEngineId = (typeof SEARCH_ENGINES)[number]['id'];

export function searchEngineById(id: string | null | undefined) {
  return SEARCH_ENGINES.find((engine) => engine.id === id) ?? SEARCH_ENGINES[0];
}
