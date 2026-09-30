import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-panel',
  templateUrl: './dashboard-panel.html',
  styleUrl: './dashboard-panel.scss',
  imports: [MatCardModule, MatIconModule],
})
export class DashboardPanel {
  //sono signal
  title = input.required<string>();
  subtitle = input<string>();
  icon = input<string>('dashboard');
}
