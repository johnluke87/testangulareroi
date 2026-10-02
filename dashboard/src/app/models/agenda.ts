// I dati dell'Agenda come arrivano dal NOSTRO server (che li prende da Google Calendar).

/** GET /google/status */
export interface GoogleStatus {
  /** il server ha client_id e client_secret di Google in config.php */
  configured: boolean;
  connected: boolean;
  email: string | null;
}

/** ok | not_connected (Google non collegato) | reconnect (Google ha tolto il permesso: ricollegare) */
export type GoogleDataStatus = 'ok' | 'not_connected' | 'reconnect';

export interface GoogleCalendar {
  id: string;
  name: string;
  /** colore del calendario su Google, es. '#4285f4' */
  color: string;
  primary: boolean;
  /** lo mostro nell'Agenda? */
  selected: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarName: string;
  color: string;
  title: string;
  location: string | null;
  /** link all'evento su Google Calendar */
  link: string | null;
  allDay: boolean;
  /**
   * allDay = true  -> 'YYYY-MM-DD' (e la fine è ESCLUSA: un evento del solo 2 ottobre finisce il '3')
   * allDay = false -> data e ora ISO con fuso, es. '2026-10-02T09:00:00+02:00'
   */
  start: string;
  end: string;
}

export interface CalendarsResponse {
  status: GoogleDataStatus;
  calendars: GoogleCalendar[];
}

export interface EventsResponse {
  status: GoogleDataStatus;
  events: CalendarEvent[];
}
