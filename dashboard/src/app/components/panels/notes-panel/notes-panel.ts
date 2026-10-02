import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Notes } from '../../../core/services/notes';

@Component({
  selector: 'app-notes-panel',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './notes-panel.html',
  styleUrl: './notes-panel.scss',
})
export class NotesPanel {
  protected notes = inject(Notes);
  protected draft = signal('');
  protected errorMessage = signal<string | null>(null);
  protected saving = signal(false);

  protected add(): void {
    const body = this.draft().trim();
    if (body === '' || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);
    this.notes.create(body).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.draft.set(''),
      error: () => this.errorMessage.set('Non sono riuscito a salvare la nota'),
    });
  }

  protected remove(id: number): void {
    this.errorMessage.set(null);
    this.notes.remove(id).subscribe({
      error: () => this.errorMessage.set('Non sono riuscito a cancellare la nota'),
    });
  }
}
