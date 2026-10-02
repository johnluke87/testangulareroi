import { Component, computed, inject } from '@angular/core';
import { Clock } from '../../../core/services/clock';
import { quoteForDate } from '../../../shared/quotes';

@Component({
  selector: 'app-quote-panel',
  templateUrl: './quote-panel.html',
  styleUrl: './quote-panel.scss',
})
export class QuotePanel {
  private clock = inject(Clock);

  protected quote = computed(() => quoteForDate(this.clock.now()));
}
