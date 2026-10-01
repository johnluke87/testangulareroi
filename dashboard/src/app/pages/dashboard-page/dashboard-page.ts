import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { DashboardPanel } from '../../components/shared/dashboard-panel/dashboard-panel';
import { TodayPanel } from '../../components/panels/today-panel/today-panel';
import { WeatherPanel } from '../../components/panels/weather-panel/weather-panel';
import { PanelConfig } from '../../models/panel';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TasksPanel } from '../../components/panels/tasks-panel/tasks-panel';

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardPanel, TodayPanel, WeatherPanel, TasksPanel, MatButtonModule, MatIconModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  protected readonly title = signal('Dashboard');

  protected readonly panels: PanelConfig[] = [
  { id: "today", title: 'Oggi', icon: 'today' },
  { id: "weather", title: 'Meteo', icon: 'wb_sunny', wide: true },
  { id: "agenda", title: 'Agenda', icon: 'event' },
  { id: "tasks", title: 'Task', icon: 'checklist' },
  { id: "games", title: 'Giochi', icon: 'casino' },
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
