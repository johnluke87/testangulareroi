import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { DashboardPanel } from '../../components/shared/dashboard-panel/dashboard-panel';
import { TodayPanel } from '../../components/panels/today-panel/today-panel';
import { WeatherPanel } from '../../components/panels/weather-panel/weather-panel';
import { PanelConfig } from '../../models/panel';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TasksPanel } from '../../components/panels/tasks-panel/tasks-panel';
import { GamesPanel } from '../../components/panels/games-panel/games-panel';
import { AgendaPanel } from '../../components/panels/agenda-panel/agenda-panel';
import { LinksPanel } from '../../components/panels/links-panel/links-panel';
import { NotesPanel } from '../../components/panels/notes-panel/notes-panel';
import { QuotePanel } from '../../components/panels/quote-panel/quote-panel';
import { SearchPanel } from '../../components/panels/search-panel/search-panel';
import { NewsPanel } from '../../components/panels/news-panel/news-panel';
import { OnThisDayPanel } from '../../components/panels/on-this-day-panel/on-this-day-panel';
import { HomePanel } from '../../components/panels/home-panel/home-panel';

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardPanel, TodayPanel, WeatherPanel, TasksPanel, GamesPanel, AgendaPanel, LinksPanel, NotesPanel, QuotePanel, SearchPanel, NewsPanel, OnThisDayPanel, HomePanel, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  //"Oggi" e "Cerca" non sono più blocchi: stanno nella riga in alto (header)
  //L'ordine qui è l'ordine nella griglia: da sinistra a destra, poi a capo
  protected readonly panels: PanelConfig[] = [
  { id: "tasks", title: 'Task', icon: 'checklist' },
  { id: "agenda", title: 'Agenda', icon: 'event' },
  { id: "weather", title: 'Meteo', icon: 'wb_sunny', wide: true },
  { id: "home", title: 'Casa', icon: 'home' },
  { id: "notes", title: 'Note', icon: 'edit_note' },
  { id: "links", title: 'Link', icon: 'link' },
  { id: "news", title: 'Notizie', icon: 'newspaper' },
  { id: "games", title: 'Giochi', icon: 'casino' },
  { id: "quote", title: 'Frase del giorno', icon: 'format_quote' },
  { id: "onthisday", title: 'In questo giorno', icon: 'history_edu' },
];

  protected auth = inject(Auth);
  private router = inject(Router);

  protected logout(): void {
  this.auth.logout().subscribe({
    complete: () => this.router.navigateByUrl('/login'),
    error: () => this.router.navigateByUrl('/login'),
  });
}
}
