import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FavoritePlacesEditor } from '../../components/panels/weather-panel/favorite-places-editor/favorite-places-editor';
import { Auth } from '../../core/services/auth';
import { GoogleCalendar } from '../../core/services/google-calendar';
import { UserSettings } from '../../core/services/user-settings';
import { SEARCH_ENGINES, SearchEngineId } from '../../shared/search-engines';
import { TuyaSettings } from '../../components/settings/tuya-settings/tuya-settings';

/** I messaggi da mostrare al ritorno da Google (vedi redirect_with_query in google.php). */
const GOOGLE_MESSAGES: Record<string, string> = {
  connected: 'Google collegato! Scegli qui sotto quali calendari vedere nell\'Agenda.',
  denied: 'Collegamento annullato su Google.',
  'error:login': 'Devi essere collegato alla dashboard per collegare Google.',
  'error:not_configured': 'Il server non è ancora configurato per Google.',
  'error:expired': 'Il collegamento è scaduto (più di 15 minuti): riprova.',
  'error:scope': 'Serve il permesso di vedere i calendari: riprova lasciando la spunta su Google.',
  'error:token': 'Google non ha completato il collegamento: riprova.',
  'error:no_code': 'Google non ha completato il collegamento: riprova.',
  'error:no_refresh': 'Google non ha concesso l\'accesso permanente: riprova.',
};

/**
 * Pagina /settings: tutte le preferenze dell'utente collegato, una sezione per argomento.
 * Ogni sezione salva per conto suo (le località subito, BGG col suo bottone).
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FavoritePlacesEditor,
    TuyaSettings,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  protected auth = inject(Auth);
  protected userSettings = inject(UserSettings);
  protected google = inject(GoogleCalendar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- BoardGameGeek ---
  //un FormGroup anche per un campo solo: è [formGroup] sul <form> che intercetta l'invio (ngSubmit)
  //ed evita che il browser ricarichi la pagina come farebbe con un form HTML normale
  protected bggForm = new FormGroup({ username: new FormControl('', { nonNullable: true }) });
  protected bggUsername = this.bggForm.controls.username;
  protected bggSaving = signal(false);
  protected bggMessage = signal<string | null>(null);

  protected searchEngines = SEARCH_ENGINES;
  protected searchSaving = signal(false);
  protected searchMessage = signal<string | null>(null);

  constructor() {
    // lo stato di Google lo richiedo ogni volta che apri la pagina: potrebbe essere cambiato
    // (es. il server ha scoperto che Google ha revocato il permesso)
    this.google.status.reload();

    // quando arrivano le impostazioni dal server, metto il valore salvato nel campo.
    // effect = "esegui questo codice ogni volta che cambiano i signal che leggi qui dentro"
    effect(() => {
      const saved = this.userSettings.settings()?.bggUsername ?? '';
      this.bggUsername.setValue(saved);
    });
  }

  protected saveSearchEngine(engine: SearchEngineId): void {
    if (engine === this.userSettings.settings()?.searchEngine) {
      return;
    }
    this.searchSaving.set(true);
    this.searchMessage.set(null);
    this.userSettings.update({ searchEngine: engine }).subscribe({
      next: () => {
        this.searchMessage.set('Salvato');
        this.searchSaving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.searchMessage.set(error.error?.error ?? 'Salvataggio non riuscito');
        this.searchSaving.set(false);
      },
    });
  }

  protected saveBgg(): void {
    this.bggSaving.set(true);
    this.bggMessage.set(null);
    this.userSettings.update({ bggUsername: this.bggUsername.value.trim() || null }).subscribe({
      next: () => {
        this.bggMessage.set('Salvato');
        this.bggSaving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.bggMessage.set(error.error?.error ?? 'Salvataggio non riuscito');
        this.bggSaving.set(false);
      },
    });
  }

  // --- Google Calendar ---
  protected googleMessage = signal<string | null>(GOOGLE_MESSAGES[this.readGoogleResult()] ?? null);
  protected googleBusy = signal(false);

  //i calendari, sempre un array (value() in errore lancerebbe, quindi controllo hasValue)
  protected calendars = computed(() =>
    this.google.calendars.hasValue() ? (this.google.calendars.value()?.calendars ?? []) : [],
  );

  /** Spunta o togli un calendario: mando al server l'elenco completo di quelli scelti. */
  protected toggleCalendar(calendarId: string, checked: boolean): void {
    const ids = this.calendars()
      .filter((c) => (c.id === calendarId ? checked : c.selected))
      .map((c) => c.id);
    this.googleBusy.set(true);
    this.google.saveSelection(ids).subscribe({
      next: () => this.googleBusy.set(false),
      error: () => {
        this.googleMessage.set('Non sono riuscito a salvare la scelta dei calendari');
        this.googleBusy.set(false);
      },
    });
  }

  protected disconnectGoogle(): void {
    if (!confirm("Scollegare Google? L'Agenda resterà vuota finché non lo ricolleghi.")) {
      return;
    }
    this.googleBusy.set(true);
    this.google.disconnect().subscribe({
      next: () => {
        this.googleMessage.set('Google scollegato');
        this.googleBusy.set(false);
      },
      error: () => this.googleBusy.set(false),
    });
  }

  /**
   * Al ritorno da Google l'indirizzo è /settings?google=connected (o denied, o error&reason=...).
   * Leggo il risultato una volta e poi tolgo i parametri dall'indirizzo, così ricaricando la pagina il messaggio non ricompare.
   */
  private readGoogleResult(): string {
    const params = this.route.snapshot.queryParamMap;
    const result = params.get('google');
    if (result === null) {
      return '';
    }
    this.router.navigate([], { queryParams: {}, replaceUrl: true, fragment: 'agenda' });
    return result === 'error' ? `error:${params.get('reason') ?? ''}` : result;
  }

  // --- Account ---
  protected logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
