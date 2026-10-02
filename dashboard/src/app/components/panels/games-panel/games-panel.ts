import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { RouterLink } from '@angular/router';
import { Games } from '../../../core/services/games';
import {
  bggUrl,
  CollectionGame,
  DEFAULT_FILTERS,
  FILTER_LIMITS,
  GameFilters,
  matchesFilters,
  playersLabel,
  rangeLabel,
  timeLabel,
} from '../../../models/game';

type GamesTab = 'tonight' | 'collection' | 'hot';

const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * La card Giochi con tre schede:
 *  - Stasera: "a cosa giochiamo?" — sceglie a caso tra i TUOI giochi che passano i filtri;
 *  - Collezione: la tua collezione BoardGameGeek;
 *  - Del momento: i giochi più chiacchierati su BGG.
 */
@Component({
  selector: 'app-games-panel',
  //NgTemplateOutlet: per riusare il blocco <ng-template #collectionState> in due schede senza copiarlo
  imports: [NgTemplateOutlet, MatButtonModule, MatButtonToggleModule, MatIconModule, MatSliderModule, RouterLink],
  templateUrl: './games-panel.html',
  styleUrl: './games-panel.scss',
})
export class GamesPanel {
  protected games = inject(Games);

  protected tab = signal<GamesTab>('tonight');

  // funzioni e costanti del modello rese visibili al template
  protected bggUrl = bggUrl;
  protected playersLabel = playersLabel;
  protected timeLabel = timeLabel;
  protected rangeLabel = rangeLabel;
  protected limits = FILTER_LIMITS;
  protected playerCounts = PLAYER_COUNTS;

  // --- Stasera ---

  /** Tutti i filtri in un unico oggetto: un signal solo, aggiornato con patchFilters. */
  protected filters = signal<GameFilters>(DEFAULT_FILTERS);
  protected showFilters = signal(false);
  protected picked = signal<CollectionGame | null>(null);

  protected candidates = computed(() =>
    this.games.collectionGames().filter((game) => matchesFilters(game, this.filters())),
  );

  /** Quanti filtri hai ristretto rispetto a quelli "aperti" (per il numerino sul bottone Filtri). */
  protected activeFilters = computed(() => {
    const f = this.filters();
    const d = DEFAULT_FILTERS;
    return [
      f.minMinutes !== d.minMinutes || f.maxMinutes !== d.maxMinutes,
      f.minRating !== d.minRating || f.maxRating !== d.maxRating,
      f.minWeight !== d.minWeight || f.maxWeight !== d.maxWeight,
      f.neverPlayed,
    ].filter(Boolean).length;
  });

  /** Cambia uno o più filtri. Il gioco pescato prima potrebbe non andare più bene: lo tolgo. */
  protected patchFilters(changes: Partial<GameFilters>): void {
    this.filters.update((current) => ({ ...current, ...changes }));
    this.picked.set(null);
  }

  protected resetFilters(): void {
    // tengo il numero di giocatori: è il filtro che cambi apposta ogni sera
    this.patchFilters({ ...DEFAULT_FILTERS, players: this.filters().players });
  }

  /** Pesca un gioco a caso tra quelli adatti (se possibile diverso da quello appena uscito). */
  protected pick(): void {
    const pool = this.candidates();
    if (pool.length === 0) {
      this.picked.set(null);
      return;
    }
    const others = pool.length > 1 ? pool.filter((g) => g.id !== this.picked()?.id) : pool;
    this.picked.set(others[Math.floor(Math.random() * others.length)]);
  }

  /** Testo sopra il cursore della durata: il massimo vale "e oltre". */
  protected minutesLabel(min: number, max: number): string {
    const upper = max >= FILTER_LIMITS.minutes.max ? `${max}+` : `${max}`;
    return min === 0 && max >= FILTER_LIMITS.minutes.max ? 'qualsiasi' : `${min}–${upper} min`;
  }

  /** Il messaggio d'errore del server (es. "BoardGameGeek non è ancora configurato…"), se c'è. */
  protected errorText(error: unknown): string {
    return error instanceof HttpErrorResponse && error.error?.error
      ? error.error.error
      : 'BoardGameGeek non è raggiungibile in questo momento';
  }
}
