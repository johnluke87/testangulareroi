import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../../../core/services/clock';
import { GoogleCalendar } from '../../../core/services/google-calendar';
import { buildAgenda } from '../../../shared/agenda';
import { RelativeDayPipe } from '../../../shared/pipes/relative-day-pipe';

//tutti i 7 giorni: la card ha altezza fissa e si scorre, con "Oggi" in cima
const DAYS_AHEAD = 7;

/** Il pannello Agenda: gli impegni di oggi e dei prossimi giorni dai calendari Google scelti. */
@Component({
  selector: 'app-agenda-panel',
  imports: [DatePipe, RouterLink, RelativeDayPipe],
  templateUrl: './agenda-panel.html',
  styleUrl: './agenda-panel.scss',
})
export class AgendaPanel {
  protected google = inject(GoogleCalendar);
  protected clock = inject(Clock);

  /** Il server è configurato per Google? (undefined finché non lo sappiamo) */
  protected configured = computed(() => (this.google.status.hasValue() ? this.google.status.value()?.configured : undefined));

  // ricalcolato quando cambiano gli eventi o passa il tempo (per "adesso" e "tra 10 min")
  protected agenda = computed(() => buildAgenda(this.google.eventList(), this.clock.now(), DAYS_AHEAD));
}
