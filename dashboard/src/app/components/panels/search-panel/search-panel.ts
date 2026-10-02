import { afterNextRender, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserSettings } from '../../../core/services/user-settings';
import { searchEngineById } from '../../../shared/search-engines';

@Component({
  selector: 'app-search-panel',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './search-panel.html',
  styleUrl: './search-panel.scss',
})
export class SearchPanel {
  private userSettings = inject(UserSettings);
  private queryInput = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  protected query = signal('');

  constructor() {
    afterNextRender(() => this.queryInput()?.nativeElement.focus());
  }

  protected engine = computed(() => searchEngineById(this.userSettings.settings()?.searchEngine));

  protected search(): void {
    const query = this.query().trim();
    if (query === '') {
      return;
    }
    window.open(this.engine().url + encodeURIComponent(query), '_blank', 'noopener');
  }
}
