import { Component, signal } from '@angular/core';
import { DashboardPanel } from './components/shared/dashboard-panel/dashboard-panel';
import { TodayPanel } from './components/panels/today-panel/today-panel';
import { WeatherPanel } from './components/panels/weather-panel/weather-panel';
import { PanelConfig } from './models/panel';

@Component({
  selector: 'app-root',
  imports: [DashboardPanel, TodayPanel, WeatherPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Dashboard');

  protected readonly panels: PanelConfig[] = [
    { id: "today", title: 'Oggi', icon: 'today' },
    { id: "weather", title: 'Meteo', icon: 'wb_sunny', wide: true },
    { id: "agenda", title: 'Agenda', icon: 'event' },
    { id: "reminders", title: 'Promemoria', icon: 'checklist' },
    { id: "games", title: 'Giochi', icon: 'casino' },
  ];
}
