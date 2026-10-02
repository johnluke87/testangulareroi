import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Clock } from '../../../core/services/clock';
import { News } from '../../../core/services/news';
import { NewsItem } from '../../../models/news';
import { toDateKey } from '../../../shared/dates';

/** Il pannello Notizie: le ultime dall'ANSA, sezione a scelta; il clic apre l'articolo. */
@Component({
  selector: 'app-news-panel',
  imports: [DatePipe],
  templateUrl: './news-panel.html',
  styleUrl: './news-panel.scss',
})
export class NewsPanel {
  protected news = inject(News);
  private clock = inject(Clock);

  private todayKey = computed(() => toDateKey(this.clock.now()));

  /** Le notizie di oggi mostrano solo l'ora; quelle dei giorni prima anche la data. */
  protected isToday(item: NewsItem): boolean {
    return item.publishedAt !== null && toDateKey(new Date(item.publishedAt)) === this.todayKey();
  }
}
