export interface User {
  id: number;
  name: string;
  email: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: string | null;
  radius_km: number;
  onboarding_done: boolean;
  notify_digest: boolean;
  notify_instant: boolean;
  interests: string[];
  hidden: string[];
}

export interface Opportunity {
  id: number;
  title: string;
  summary: string;
  description: string;
  categories: string[];
  kind: string;
  emoji: string;
  opening_hours: string | null;
  open_now: boolean | null;
  municipality: string;
  address: string;
  latitude: number;
  longitude: number;
  minutes: number;
  km: number;
  price_label: string;
  price_known: boolean;
  duration_min: number;
  duration_max: number;
  weather: string;
  wow: number;
  url: string;
  source_name: string;
  why: string;
  sources: string[];
  label: string;
  facts: string | null;
  ai: boolean;
  score: number;
  saved: boolean;
}

export interface RadarPayload {
  headline: string;
  place_name: string | null;
  latitude: number;
  longitude: number;
  radius_km: number;
  weather: { label: string; temperature: number; kind: string };
  fetched_at: string;
  live: boolean;
  stale_reason: string | null;
  count: number;
  sections: {
    top: Opportunity[];
    out: Opportunity[];
    unusual: Opportunity[];
    weekend: Opportunity[];
  };
  items: Opportunity[];
  all: Opportunity[];
  itinerary: { title: string; minutes: number; note: string; stops: Opportunity[] } | null;
}

export const PREFERENCES: { id: string; label: string }[] = [
  { id: 'natura', label: 'Natura / passeggiate' },
  { id: 'gite', label: 'Gite' },
  { id: 'cibo', label: 'Cibo / sagre' },
  { id: 'cultura', label: 'Cultura / storia' },
  { id: 'mercatini', label: 'Mercatini' },
  { id: 'eventi', label: 'Eventi' },
  { id: 'sport', label: 'Sport' },
  { id: 'insolito', label: 'Attività insolite' },
  { id: 'famiglia', label: 'Famiglia / bambini' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'gratis', label: 'Gratis / economico' },
];
