<?php
declare(strict_types=1);

/*
 * Casa: i dispositivi Smart Life, tramite le API cloud di Tuya (Tuya Developer Platform).
 * Ogni utente mette nelle impostazioni le SUE chiavi (Access ID / Access Secret del suo progetto Tuya)
 * e il suo UID Smart Life. Il secret e il token sono salvati CIFRATI (crypto.php).
 *
 * Ogni richiesta a Tuya va FIRMATA (HMAC-SHA256 con l'Access Secret), come da loro documentazione:
 *   stringToSign = METODO \n sha256(corpo) \n header-firmati \n percorso?query-ordinata
 *   sign = MAIUSCOLO( HMAC-SHA256( access_id + [access_token] + t + stringToSign, access_secret ) )
 */

const TUYA_REGIONS = [
    'eu'   => ['label' => 'Europa centrale',     'url' => 'https://openapi.tuyaeu.com'],
    'weu'  => ['label' => 'Europa occidentale',  'url' => 'https://openapi-weaz.tuyaeu.com'],
    'us'   => ['label' => 'America occidentale', 'url' => 'https://openapi.tuyaus.com'],
    'ueaz' => ['label' => 'America orientale',   'url' => 'https://openapi-ueaz.tuyaus.com'],
    'in'   => ['label' => 'India',               'url' => 'https://openapi.tuyain.com'],
    'cn'   => ['label' => 'Cina',                'url' => 'https://openapi.tuyacn.com'],
];
const TUYA_PURPOSE = 'tuya-secrets';
const TUYA_DEVICES_TTL = 30;        // stato dei dispositivi: al massimo una richiesta a Tuya ogni 30 secondi per utente
const TUYA_DEVICES_FRESH_TTL = 5;   // con ?fresh=1 (bottone "Aggiorna ora"): basta che la copia abbia meno di 5 secondi
const TUYA_SPECS_PER_CALL = 15;     // "schede tecniche" (unità di misura, decimali) scaricate per ogni richiesta
const TUYA_TOKEN_INVALID_CODES = [1010, 1011];
// gli unici codici che la dashboard può comandare: switch, switch_led, switch_1 ... switch_9
const TUYA_SWITCH_CODE_PATTERN = '/^switch(_led|_[1-9])?$/';

/** Errore restituito da Tuya ("success": false), con il suo codice e messaggio. */
final class TuyaError extends RuntimeException
{
    public function __construct(public readonly int $tuyaCode, string $message)
    {
        parent::__construct($message);
    }
}

// --- Handler delle rotte ---

/** GET /tuya/config  -> la configurazione SENZA il secret (non esce mai dal server) */
function handle_tuya_get_config(): never
{
    $user = require_user();
    $account = tuya_account($user['id']);
    json_response([
        'configured' => $account !== null,
        'region'     => $account['region'] ?? 'eu',
        'accessId'   => $account['access_id'] ?? '',
        'appUid'     => $account['app_uid'] ?? '',
        'regions'    => array_map(
            fn (string $id, array $r) => ['id' => $id, 'label' => $r['label']],
            array_keys(TUYA_REGIONS),
            TUYA_REGIONS,
        ),
    ]);
}

/**
 * POST /tuya/config  { region, accessId, accessSecret?, appUid }
 * accessSecret si può omettere se è già salvato (così non devi riscriverlo per cambiare solo l'UID).
 * Dopo il salvataggio PROVO subito il collegamento e rispondo con quanti dispositivi vedo, o con l'errore di Tuya.
 */
function handle_tuya_save_config(): never
{
    $user = require_user();
    $body = read_json_body();
    $existing = tuya_account($user['id']);

    $region = $body['region'] ?? null;
    if (!is_string($region) || !isset(TUYA_REGIONS[$region])) {
        throw new HttpException(400, 'Data center non valido');
    }
    $accessId = is_string($body['accessId'] ?? null) ? trim($body['accessId']) : '';
    if (preg_match('/^[A-Za-z0-9]{10,64}$/', $accessId) !== 1) {
        throw new HttpException(400, 'Access ID non valido (lo trovi in Overview del progetto Tuya)');
    }
    $appUid = is_string($body['appUid'] ?? null) ? trim($body['appUid']) : '';
    if (preg_match('/^[A-Za-z0-9]{6,64}$/', $appUid) !== 1) {
        throw new HttpException(400, 'UID non valido (lo trovi in Devices → Link App Account)');
    }
    $secret = is_string($body['accessSecret'] ?? null) ? trim($body['accessSecret']) : '';
    if ($secret === '' && $existing === null) {
        throw new HttpException(400, "Serve l'Access Secret");
    }
    if ($secret !== '' && preg_match('/^[A-Za-z0-9]{10,64}$/', $secret) !== 1) {
        throw new HttpException(400, 'Access Secret non valido');
    }

    db()->prepare(
        'INSERT INTO dashboard_tuya_accounts (user_id, region, access_id, access_secret, app_uid, token, token_expires_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)
         ON DUPLICATE KEY UPDATE region = VALUES(region), access_id = VALUES(access_id),
            access_secret = VALUES(access_secret), app_uid = VALUES(app_uid),
            token = NULL, token_expires_at = NULL, updated_at = VALUES(updated_at)'
    )->execute([
        $user['id'],
        $region,
        $accessId,
        $secret !== '' ? encrypt_secret($secret, TUYA_PURPOSE) : $existing['access_secret'],
        $appUid,
        now_utc(),
    ]);
    tuya_forget_devices($user['id']);

    // prova del collegamento: token + elenco dispositivi
    try {
        $devices = tuya_api_get($user['id'], "/v1.0/users/$appUid/devices");
        json_response(['ok' => true, 'devices' => count($devices)]);
    } catch (TuyaError $e) {
        json_response(['ok' => false, 'error' => tuya_error_text($e)]);
    }
}

/** DELETE /tuya/config  -> dimentica chiavi e token */
function handle_tuya_delete_config(): never
{
    $user = require_user();
    db()->prepare('DELETE FROM dashboard_tuya_accounts WHERE user_id = ?')->execute([$user['id']]);
    tuya_forget_devices($user['id']);
    no_content();
}

/** GET /tuya/devices  -> { status: not_configured | ok | error, devices: [...] } */
function handle_tuya_devices(): never
{
    $user = require_user();
    $account = tuya_account($user['id']);
    if ($account === null) {
        json_response(['status' => 'not_configured', 'devices' => []]);
    }

    $cacheKey = 'tuya-devices:' . $user['id'];
    // "Aggiorna ora": quasi sempre dati nuovi, ma non più di una richiesta a Tuya ogni 5 secondi anche premendo a raffica
    $ttl = ($_GET['fresh'] ?? '') === '1' ? TUYA_DEVICES_FRESH_TTL : TUYA_DEVICES_TTL;
    $fresh = bgg_cache_get($cacheKey, $ttl);
    if ($fresh !== null) {
        json_response(['status' => 'ok', 'devices' => $fresh]);
    }

    try {
        $raw = tuya_api_get($user['id'], '/v1.0/users/' . $account['app_uid'] . '/devices');
        $specs = tuya_specs($user['id'], array_map(fn (array $d) => (string) $d['id'], $raw));
    } catch (TuyaError $e) {
        $stale = bgg_cache_get($cacheKey, null);
        if ($stale !== null) {
            json_response(['status' => 'ok', 'devices' => $stale]);
        }
        json_response(['status' => 'error', 'error' => tuya_error_text($e), 'devices' => []]);
    }

    // le stanze come nell'app Smart Life; se Tuya non le dà (permessi del progetto) i dispositivi restano senza stanza
    $rooms = tuya_rooms($user['id'], $account['app_uid']);

    $devices = array_map(function (array $d) use ($specs, $rooms) {
        $device = tuya_format_device($d, $specs[(string) $d['id']] ?? null);
        $device['room'] = $rooms['byDevice'][$device['id']] ?? null;
        return $device;
    }, $raw);

    // in ordine di stanza (quello dell'app), poi di nome; quelli senza stanza in fondo
    $order = array_flip($rooms['names']);
    usort($devices, fn (array $a, array $b) =>
        [$order[$a['room']] ?? PHP_INT_MAX, mb_strtolower($a['name'])]
        <=> [$order[$b['room']] ?? PHP_INT_MAX, mb_strtolower($b['name'])]);

    bgg_cache_put($cacheKey, $devices); // la tabella di cache generica, la stessa di giochi e notizie
    json_response(['status' => 'ok', 'devices' => $devices]);
}

/**
 * POST /tuya/devices/{id}/command  { "code": "switch_1", "value": true }
 * Solo accendi/spegni: codici "switch..." con valore true/false. Niente comandi arbitrari
 * (allarmi, serrature, impostazioni): se un giorno serviranno, li aggiungeremo uno per uno.
 */
function handle_tuya_command(string $deviceId): never
{
    $user = require_user();
    if (tuya_account($user['id']) === null) {
        throw new HttpException(409, 'Tuya non è configurato');
    }
    $body = read_json_body();
    $code = $body['code'] ?? null;
    $value = $body['value'] ?? null;
    if (!is_string($code) || preg_match(TUYA_SWITCH_CODE_PATTERN, $code) !== 1 || !is_bool($value)) {
        throw new HttpException(400, 'Si può solo accendere o spegnere');
    }

    try {
        tuya_api_call($user['id'], 'POST', "/v1.0/devices/$deviceId/commands", [], [
            'commands' => [['code' => $code, 'value' => $value]],
        ]);
    } catch (TuyaError $e) {
        throw new HttpException(502, $e->tuyaCode === 1106
            ? 'Il progetto Tuya è in sola lettura: in Devices → Link App Account imposta i permessi su "Controllable".'
            : tuya_error_text($e));
    }

    tuya_forget_devices($user['id']); // alla prossima lettura voglio lo stato nuovo, non quello in cache
    json_response(['ok' => true]);
}

/**
 * Le stanze dell'utente: { names: [stanze in ordine], byDevice: { deviceId: nome stanza } }.
 * Tuya: case dell'account -> stanze di ogni casa -> dispositivi di ogni stanza. Cache 10 minuti.
 */
function tuya_rooms(int $userId, string $appUid): array
{
    $cacheKey = 'tuya-rooms:' . $userId;
    $cached = bgg_cache_get($cacheKey, 10 * 60);
    if ($cached !== null) {
        return $cached;
    }

    $rooms = ['names' => [], 'byDevice' => []];
    try {
        foreach (tuya_api_get($userId, "/v1.0/users/$appUid/homes") as $home) {
            $homeId = (string) ($home['home_id'] ?? '');
            if ($homeId === '') {
                continue;
            }
            $homeRooms = tuya_api_get($userId, "/v1.0/homes/$homeId/rooms")['rooms'] ?? [];
            foreach ($homeRooms as $room) {
                $name = (string) ($room['name'] ?? '');
                $roomId = (string) ($room['room_id'] ?? '');
                if ($name === '' || $roomId === '') {
                    continue;
                }
                $rooms['names'][] = $name;
                foreach (tuya_api_get($userId, "/v1.0/homes/$homeId/rooms/$roomId/devices") as $device) {
                    $rooms['byDevice'][(string) $device['id']] = $name;
                }
            }
        }
    } catch (TuyaError $e) {
        error_log('Tuya rooms: ' . $e->tuyaCode . ' ' . $e->getMessage());
        // senza stanze si va avanti lo stesso: il pannello mostra un unico elenco
    }
    $rooms['names'] = array_values(array_unique($rooms['names']));

    bgg_cache_put($cacheKey, $rooms);
    return $rooms;
}

// --- Chiamate firmate a Tuya ---

/** Una GET verso Tuya con il token dell'utente. */
function tuya_api_get(int $userId, string $path, array $query = []): array
{
    return tuya_api_call($userId, 'GET', $path, $query);
}

/** Una chiamata verso Tuya con il token dell'utente; se il token è scaduto lo rinnovo e riprovo una volta. */
function tuya_api_call(int $userId, string $method, string $path, array $query = [], ?array $body = null): array
{
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        $account = tuya_account($userId) ?? throw new TuyaError(0, 'Tuya non è configurato');
        $token = tuya_token($userId, $account, forceRefresh: $attempt === 2);
        try {
            return tuya_signed_request($account, $method, $path, $query, $token, $body);
        } catch (TuyaError $e) {
            if (!in_array($e->tuyaCode, TUYA_TOKEN_INVALID_CODES, true) || $attempt === 2) {
                throw $e;
            }
        }
    }
    throw new TuyaError(0, 'Tuya non risponde');
}

/** Il token di accesso (dura circa 2 ore): dal database se ancora valido, altrimenti lo chiedo a Tuya. */
function tuya_token(int $userId, array $account, bool $forceRefresh = false): string
{
    $valid = $account['token'] !== null && $account['token_expires_at'] > gmdate('Y-m-d H:i:s', time() + 60);
    if ($valid && !$forceRefresh) {
        return decrypt_secret($account['token'], TUYA_PURPOSE);
    }

    $result = tuya_signed_request($account, 'GET', '/v1.0/token', ['grant_type' => 1], null);
    $token = (string) ($result['access_token'] ?? '');
    if ($token === '') {
        throw new TuyaError(0, 'Tuya non ha restituito un token');
    }
    db()->prepare('UPDATE dashboard_tuya_accounts SET token = ?, token_expires_at = ? WHERE user_id = ?')
        ->execute([
            encrypt_secret($token, TUYA_PURPOSE),
            gmdate('Y-m-d H:i:s', time() + (int) ($result['expire_time'] ?? 3600)),
            $userId,
        ]);
    return $token;
}

/** La richiesta firmata vera e propria. Restituisce "result" se Tuya risponde success: true. */
function tuya_signed_request(
    array $account,
    string $method,
    string $path,
    array $query,
    ?string $accessToken,
    ?array $body = null,
): array {
    // la query va ordinata per chiave; i valori che usiamo sono solo lettere e numeri, quindi niente codifica
    ksort($query);
    $pathWithQuery = $path . ($query === [] ? '' : '?' . implode('&', array_map(
        fn ($key) => $key . '=' . $query[$key],
        array_keys($query),
    )));

    $t = (string) (int) round(microtime(true) * 1000); // millisecondi, come vuole Tuya
    // il corpo (JSON) entra nella firma col suo hash: va firmata ESATTAMENTE la stringa che spediamo
    $bodyJson = $body === null ? '' : json_encode($body, JSON_THROW_ON_ERROR);
    $bodyHash = hash('sha256', $bodyJson);
    $stringToSign = $method . "\n" . $bodyHash . "\n" . '' . "\n" . $pathWithQuery;
    $secret = decrypt_secret($account['access_secret'], TUYA_PURPOSE);
    $sign = strtoupper(hash_hmac('sha256', $account['access_id'] . ($accessToken ?? '') . $t . $stringToSign, $secret));

    $headers = [
        'client_id: ' . $account['access_id'],
        'sign: ' . $sign,
        't: ' . $t,
        'sign_method: HMAC-SHA256',
        'Accept: application/json',
    ];
    if ($accessToken !== null) {
        $headers[] = 'access_token: ' . $accessToken;
    }
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
    }

    $baseUrl = (string) (config()['tuya_base_url_override'] ?? TUYA_REGIONS[$account['region']]['url']);
    [$status, $data] = http_json($method, $baseUrl . $pathWithQuery, $headers, null, $body === null ? null : $bodyJson);

    if ($status !== 200 || ($data['success'] ?? false) !== true) {
        throw new TuyaError((int) ($data['code'] ?? $status), (string) ($data['msg'] ?? "HTTP $status"));
    }
    return is_array($data['result'] ?? null) ? $data['result'] : [];
}

/**
 * Le "schede tecniche" dei dispositivi: per ogni valore dicono unità di misura e decimali
 * (es. la temperatura arriva come 215 con scale 1 -> 21,5 °C). Non cambiano mai: cache senza scadenza.
 */
function tuya_specs(int $userId, array $deviceIds): array
{
    $specs = [];
    $fetched = 0;
    foreach ($deviceIds as $id) {
        $cached = bgg_cache_get('tuya-spec:' . $id, null);
        if ($cached !== null) {
            $specs[$id] = $cached;
            continue;
        }
        if ($fetched >= TUYA_SPECS_PER_CALL) {
            continue; // le altre alla prossima richiesta: intanto i valori si vedono senza unità
        }
        $fetched++;
        try {
            $result = tuya_api_get($userId, '/v1.0/devices/' . $id . '/specifications');
        } catch (TuyaError) {
            continue;
        }
        $byCode = [];
        foreach ($result['status'] ?? [] as $item) {
            $values = json_decode((string) ($item['values'] ?? '{}'), true) ?: [];
            $byCode[(string) $item['code']] = [
                'type'  => (string) ($item['type'] ?? ''),
                'unit'  => isset($values['unit']) ? (string) $values['unit'] : null,
                'scale' => (int) ($values['scale'] ?? 0),
            ];
        }
        $specs[$id] = $byCode;
        bgg_cache_put('tuya-spec:' . $id, $byCode);
    }
    return $specs;
}

// --- Dai dati grezzi di Tuya a righe leggibili ---

/** I codici che sappiamo "tradurre", in ordine di importanza, con l'etichetta da mostrare. */
const TUYA_CODES = [
    'master_mode'         => 'Allarme',
    'master_state'        => 'Stato',
    'switch_alarm_sound'  => 'Sirena',
    'doorcontact_state'   => 'Porta',
    'pir'                 => 'Movimento',
    'presence_state'      => 'Presenza',
    'smoke_sensor_status' => 'Fumo',
    'watersensor_state'   => 'Acqua',
    'gas_sensor_status'   => 'Gas',
    'va_temperature'      => 'Temperatura',
    'temp_current'        => 'Temperatura',
    'temp_indoor'         => 'Temperatura',
    'va_humidity'         => 'Umidità',
    'humidity_value'      => 'Umidità',
    'humidity_indoor'     => 'Umidità',
    'temp_set'            => 'Impostata',
    'switch_led'          => 'Luce',
    'switch'              => 'Stato',
    'switch_1'            => 'Canale 1',
    'switch_2'            => 'Canale 2',
    'switch_3'            => 'Canale 3',
    'switch_4'            => 'Canale 4',
    'cur_power'           => 'Potenza',
    'battery_percentage'  => 'Batteria',
    'va_battery'          => 'Batteria',
    'battery_state'       => 'Batteria',
];
const TUYA_MAX_VALUES = 4;

function tuya_format_device(array $device, ?array $spec): array
{
    $status = [];
    foreach ($device['status'] ?? [] as $s) {
        $status[(string) $s['code']] = $s['value'];
    }

    $values = [];
    foreach (TUYA_CODES as $code => $label) {
        if (array_key_exists($code, $status) && count($values) < TUYA_MAX_VALUES) {
            $values[] = tuya_value($code, $label, $status[$code], $spec[$code] ?? null);
        }
    }
    // nessun codice conosciuto: mostro i primi valori così come sono
    if ($values === []) {
        foreach (array_slice($status, 0, 2, true) as $code => $value) {
            $text = is_bool($value) ? ($value ? 'Sì' : 'No') : (is_scalar($value) ? (string) $value : '…');
            $values[] = ['code' => (string) $code, 'label' => (string) $code, 'text' => $text, 'alert' => false, 'switchable' => false];
        }
    }

    return [
        'id'       => (string) $device['id'],
        'name'     => (string) ($device['name'] ?? 'Dispositivo'),
        'category' => (string) ($device['category'] ?? ''),
        'online'   => (bool) ($device['online'] ?? false),
        'values'   => $values,
    ];
}

/** Un valore in parole: { label: "Porta", text: "Aperta", alert: true } */
function tuya_value(string $code, string $label, mixed $value, ?array $spec): array
{
    $isAlarmSensor = in_array($code, ['smoke_sensor_status', 'watersensor_state', 'gas_sensor_status'], true);

    $text = match (true) {
        str_starts_with($code, 'switch')                        => $value ? 'Acceso' : 'Spento',
        $code === 'doorcontact_state'                           => $value ? 'Aperta' : 'Chiusa',
        $code === 'pir' || $code === 'presence_state'           => in_array($value, ['pir', 'presence'], true) ? 'Rilevato' : 'Nessuno',
        $isAlarmSensor                                          => $value === 'alarm' ? 'ALLARME' : 'Ok',
        $code === 'master_state'                                => $value === 'alarm' ? 'ALLARME' : 'Normale',
        $code === 'master_mode' => match ($value) {
            'disarmed' => 'Disinserito',
            'arm'      => 'Inserito',
            'home'     => 'In casa',
            'sos'      => 'SOS',
            default    => (string) $value,
        },
        $code === 'battery_state' => match ($value) {
            'low'    => 'Bassa',
            'middle' => 'Media',
            'high'   => 'Alta',
            default  => (string) $value,
        },
        is_int($value) || is_float($value) => tuya_number($code, $value, $spec),
        default                            => is_scalar($value) ? (string) $value : '…',
    };

    // "alert" = da evidenziare nel pannello (porta aperta, movimento, allarme, batteria scarica)
    $alert = match (true) {
        $code === 'doorcontact_state'                 => (bool) $value,
        $code === 'pir' || $code === 'presence_state' => in_array($value, ['pir', 'presence'], true),
        $isAlarmSensor                                => $value === 'alarm',
        $code === 'master_mode'                       => $value === 'sos',
        $code === 'master_state'                      => $value === 'alarm',
        $code === 'battery_state'                     => $value === 'low',
        $code === 'battery_percentage'                => is_numeric($value) && $value <= 15,
        default                                       => false,
    };

    // interruttore comandabile dalla dashboard (solo switch/switch_led/switch_N con valore vero/falso)
    $switchable = is_bool($value) && preg_match(TUYA_SWITCH_CODE_PATTERN, $code) === 1;

    return [
        'code'       => $code,
        'label'      => $label,
        'text'       => $text,
        'alert'      => $alert,
        'switchable' => $switchable,
        'on'         => $switchable ? $value : null,
    ];
}

/** 215 con scale 1 -> "21,5 °C". Senza scheda tecnica uso l'unità più probabile per quel codice. */
function tuya_number(string $code, int|float $value, ?array $spec): string
{
    $defaultUnit = match (true) {
        str_contains($code, 'temp')     => '°C',
        str_contains($code, 'humidity') => '%',
        str_contains($code, 'battery')  => '%',
        $code === 'cur_power'           => 'W',
        default                         => '',
    };
    $scale = $spec['scale'] ?? 0;
    $unit = $spec['unit'] ?? $defaultUnit;
    $number = number_format($value / (10 ** $scale), $scale, ',', '.');
    return trim($number . ' ' . str_replace('℃', '°C', (string) $unit));
}

// --- Dettagli interni ---

function tuya_account(int $userId): ?array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_tuya_accounts WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch() ?: null;
}

function tuya_forget_devices(int $userId): void
{
    db()->prepare('DELETE FROM dashboard_bgg_cache WHERE cache_key IN (?, ?)')
        ->execute(['tuya-devices:' . $userId, 'tuya-rooms:' . $userId]);
}

/** I messaggi di Tuya più comuni, spiegati. */
function tuya_error_text(TuyaError $e): string
{
    return match ($e->tuyaCode) {
        1004             => 'Firma non valida: controlla Access ID e Access Secret.',
        1010, 1011       => 'Token di Tuya non valido: riprova tra poco.',
        1106             => 'Permesso negato: l\'UID è giusto? L\'account Smart Life è collegato al progetto?',
        28841002, 28841101 => 'Il servizio "IoT Core" del progetto Tuya è scaduto: rinnovalo su platform.tuya.com.',
        default          => 'Tuya: ' . $e->getMessage() . ($e->tuyaCode ? ' (codice ' . $e->tuyaCode . ')' : ''),
    };
}
