// Casa: i dispositivi Smart Life (Tuya) come li restituisce il NOSTRO server, già "tradotti".

export interface TuyaRegion {
  id: string;
  label: string;
}

/** GET /tuya/config (il secret non c'è mai: resta sul server). */
export interface TuyaConfig {
  configured: boolean;
  region: string;
  accessId: string;
  appUid: string;
  regions: TuyaRegion[];
}

/** POST /tuya/config */
export interface TuyaConfigInput {
  region: string;
  accessId: string;
  /** vuoto = tieni quello già salvato */
  accessSecret?: string;
  appUid: string;
}

/** Risposta di POST /tuya/config: il server prova subito il collegamento. */
export interface TuyaTestResult {
  ok: boolean;
  devices?: number;
  error?: string;
}

/** Un valore di un dispositivo, es. { label: 'Temperatura', text: '21,5 °C', alert: false } */
export interface DeviceValue {
  /** il codice Tuya, es. 'switch_led': serve per mandare il comando */
  code: string;
  label: string;
  text: string;
  /** da evidenziare: porta aperta, movimento, allarme, batteria scarica */
  alert: boolean;
  /** si può accendere/spegnere dalla dashboard */
  switchable: boolean;
  /** stato dell'interruttore (solo se switchable) */
  on: boolean | null;
}

export interface SmartDevice {
  id: string;
  name: string;
  category: string;
  online: boolean;
  /** la stanza nell'app Smart Life, null se non è in nessuna stanza */
  room: string | null;
  values: DeviceValue[];
}

/** I dispositivi raggruppati per stanza, per il pannello. */
export interface RoomGroup {
  name: string;
  devices: SmartDevice[];
}

export interface DevicesResponse {
  status: 'ok' | 'not_configured' | 'error';
  devices: SmartDevice[];
  error?: string;
}
