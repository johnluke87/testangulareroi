import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Links } from '../../../core/services/links';

@Component({
  selector: 'app-links-panel',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './links-panel.html',
  styleUrl: './links-panel.scss',
})
export class LinksPanel {
  protected links = inject(Links);
  protected label = signal('');
  protected url = signal('');
  protected errorMessage = signal<string | null>(null);
  protected saving = signal(false);

  protected add(): void {
    const label = this.label().trim();
    const url = this.url().trim();
    if (label === '' || url === '' || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);
    this.links.create(label, url).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.label.set('');
        this.url.set('');
      },
      error: () => this.errorMessage.set('Non sono riuscito a salvare il link'),
    });
  }

  protected remove(id: number): void {
    this.errorMessage.set(null);
    this.links.remove(id).subscribe({
      error: () => this.errorMessage.set('Non sono riuscito a cancellare il link'),
    });
  }
}
