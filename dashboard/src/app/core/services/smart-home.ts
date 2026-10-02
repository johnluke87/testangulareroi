import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { filter, fromEvent, map, merge, Observable, Subject, switchMap, tap, timer } from 'rxjs';
import { DevicesResponse, RoomGroup, SmartDevice, TuyaConfig, TuyaConfigInput, TuyaTestResult } from '../../models/home';
import { API_BASE_URL } from '../api';
import { Auth } from './auth';

//Ogni minuto, ma SOLO con la pagina visibile: Tuya gratuito ha un limite di chiamate al mese,
//e una scheda nascosta (o il PC in standby) non deve consumarle.
const DEVICES_REFRESH_MS = 60 * 1000;

const isPageVisible = () => document.visibilityState === 'visible';

/** Casa: configurazione Tuya dell'utente e stato dei suoi dispositivi Smart Life. */
@Injectable({
  providedIn: 'root',
})
export class SmartHome {
  private http = inject(HttpClient);
  private api = inject(API_BASE_URL);
  private auth = inject(Auth);

  readonly config = rxResource({
    params: () => this.auth.user()?.username,
    stream: () => this.http.get<TuyaConfig>(`${this.api}/tuya/config`),
  });

  readonly configValue = computed<TuyaConfig | undefined>(() =>
    this.config.hasValue() ? this.config.value() : undefined,
  );
  readonly isConfigured = computed(() => !!this.configValue()?.configured);

  /** "Aggiorna ora": ogni next() fa partire una lettura che salta la cache del server. */
  private refreshRequests = new Subject<'fresh'>();

  /** Quando è arrivata l'ultima lettura (per "aggiornato alle 10:32"). */
  readonly lastUpdated = signal<Date | null>(null);

  /**
   * Lo stato dei dispositivi (solo se configurato). Una lettura parte quando:
   *  - passa un minuto e la pagina è visibile;
   *  - torni sulla scheda (visibilitychange): così vedi subito cosa hai cambiato dal telefono;
   *  - premi "Aggiorna ora".
   * merge = "ascolta tutte e tre le sorgenti insieme"; switchMap = se arriva un nuovo motivo mentre una lettura
   * è ancora in corso, quella vecchia viene annullata.
   */
  readonly devices = rxResource({
    params: () => (this.isConfigured() ? this.auth.user()?.username : undefined),
    stream: () =>
      merge(
        timer(0, DEVICES_REFRESH_MS).pipe(filter(isPageVisible), map(() => 'auto' as const)),
        fromEvent(document, 'visibilitychange').pipe(filter(isPageVisible), map(() => 'auto' as const)),
        this.refreshRequests,
      ).pipe(
        switchMap((reason) =>
          this.http
            .get<DevicesResponse>(`${this.api}/tuya/devices`, { params: reason === 'fresh' ? { fresh: 1 } : {} })
            .pipe(tap(() => this.lastUpdated.set(new Date()))),
        ),
      ),
  });

  /** Il bottone 🔄 del pannello. */
  refreshNow(): void {
    this.refreshRequests.next('fresh');
  }

  readonly deviceList = computed<SmartDevice[]>(() =>
    this.devices.hasValue() ? (this.devices.value()?.devices ?? []) : [],
  );
  /**
   * Per stanza, nell'ordine dell'app (il server li manda già ordinati per stanza):
   * raggruppo i dispositivi consecutivi con la stessa stanza; quelli senza stanza vanno in "Altri dispositivi".
   */
  readonly rooms = computed<RoomGroup[]>(() => {
    const groups: RoomGroup[] = [];
    for (const device of this.deviceList()) {
      const name = device.room ?? 'Altri dispositivi';
      const last = groups.at(-1);
      if (last && last.name === name) {
        last.devices.push(device);
      } else {
        groups.push({ name, devices: [device] });
      }
    }
    return groups;
  });

  /** Il messaggio d'errore di Tuya, se l'ultima lettura è andata male. */
  readonly devicesError = computed(() =>
    this.devices.hasValue() && this.devices.value()?.status === 'error' ? (this.devices.value()?.error ?? null) : null,
  );

  /** Salva e prova il collegamento; poi ricarica configurazione e dispositivi. */
  saveConfig(input: TuyaConfigInput): Observable<TuyaTestResult> {
    return this.http.post<TuyaTestResult>(`${this.api}/tuya/config`, input).pipe(
      tap(() => {
        this.config.reload();
        this.devices.reload();
      }),
    );
  }

  /**
   * Accende o spegne un interruttore.
   * Aggiornamento "ottimista": cambio subito lo stato sullo schermo, poi mando il comando.
   * Dopo un paio di secondi ricarico lo stato vero (il dispositivo ci mette un attimo a rispondere);
   * se il comando fallisce ricarico subito, così l'interruttore torna com'era davvero.
   */
  setSwitch(device: SmartDevice, code: string, on: boolean): Observable<unknown> {
    this.devices.update((response) =>
      response
        ? {
            ...response,
            devices: response.devices.map((d) =>
              d.id !== device.id
                ? d
                : { ...d, values: d.values.map((v) => (v.code === code ? { ...v, on, text: on ? 'Acceso' : 'Spento' } : v)) },
            ),
          }
        : response,
    );

    return this.http.post(`${this.api}/tuya/devices/${device.id}/command`, { code, value: on }).pipe(
      tap({
        next: () => setTimeout(() => this.devices.reload(), 2500),
        error: () => this.devices.reload(),
      }),
    );
  }

  deleteConfig(): Observable<unknown> {
    return this.http.delete(`${this.api}/tuya/config`).pipe(tap(() => this.config.reload()));
  }
}
