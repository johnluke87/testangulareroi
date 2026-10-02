<?php
declare(strict_types=1);

/*
 * Google Calendar, con OAuth 2.0 lato server ("authorization code" + PKCE).
 * Il browser non vede mai i token di Google: li tiene il server, cifrati, nella tabella dashboard_google_accounts.
 */

const GOOGLE_SCOPES = 'openid email https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_STATE_TTL = 15 * 60;       // il "biglietto" per tornare da Google vale 15 minuti
const GOOGLE_TOKEN_PURPOSE = 'google-tokens';
const GOOGLE_TIMEZONE = 'Europe/Rome';
const GOOGLE_MAX_CALENDARS = 50;

/** Lanciata quando Google non accetta più il nostro refresh token: l'utente deve ricollegarsi. */
final class GoogleReconnectNeeded extends RuntimeException
{
}

// --- Configurazione ---

function google_config(): array
{
    $c = config()['google'] ?? [];
    return [
        'client_id'           => (string) ($c['client_id'] ?? ''),
        'client_secret'       => (string) ($c['client_secret'] ?? ''),
        'redirect_uri'        => (string) ($c['redirect_uri'] ?? ''),
        'allowed_return_urls' => (array) ($c['allowed_return_urls'] ?? []),
        // indirizzi di Google (sovrascrivibili solo per i test)
        'auth_url'   => (string) ($c['auth_url'] ?? 'https://accounts.google.com/o/oauth2/v2/auth'),
        'token_url'  => (string) ($c['token_url'] ?? 'https://oauth2.googleapis.com/token'),
        'revoke_url' => (string) ($c['revoke_url'] ?? 'https://oauth2.googleapis.com/revoke'),
        'api_base'   => (string) ($c['api_base'] ?? 'https://www.googleapis.com/calendar/v3/'),
    ];
}

function google_is_configured(): bool
{
    $c = google_config();
    return $c['client_id'] !== '' && $c['client_secret'] !== '' && $c['redirect_uri'] !== '';
}

// --- Handler delle rotte ---

/** GET /google/status  -> { configured, connected, email } */
function handle_google_status(): never
{
    $user = require_user();
    $account = google_account($user['id']);
    json_response([
        'configured' => google_is_configured(),
        'connected'  => $account !== null,
        'email'      => $account['google_email'] ?? null,
    ]);
}

/**
 * GET /google/connect?return=<indirizzo della pagina impostazioni>
 * È una NAVIGAZIONE del browser (non una chiamata da Angular): alla fine reindirizza a Google.
 */
function handle_google_connect(): never
{
    $returnUrl = google_safe_return_url($_GET['return'] ?? null);
    $user = current_user();
    if ($user === null) {
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'login']);
    }
    if (!google_is_configured()) {
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'not_configured']);
    }

    // state: numero casuale usa-e-getta. Al ritorno da Google il cookie di sessione NON arriva
    // (SameSite=Strict e Google è un altro sito), quindi è lo state che ci dice di quale utente si tratta.
    $state = bin2hex(random_bytes(32));
    // PKCE: un segreto (verifier) che resta sul server; a Google mandiamo solo il suo hash (challenge).
    // Chi intercettasse il "code" al ritorno non potrebbe usarlo senza il verifier.
    $verifier = base64url_encode(random_bytes(48));
    $challenge = base64url_encode(hash('sha256', $verifier, true));

    db()->prepare('DELETE FROM dashboard_oauth_states WHERE created_at < ?')
        ->execute([gmdate('Y-m-d H:i:s', time() - GOOGLE_STATE_TTL)]);
    db()->prepare(
        'INSERT INTO dashboard_oauth_states (state_hash, user_id, code_verifier, return_url, created_at) VALUES (?, ?, ?, ?, ?)'
    )->execute([hash('sha256', $state), $user['id'], $verifier, $returnUrl, now_utc()]);

    $c = google_config();
    redirect_with_query($c['auth_url'], [
        'client_id'             => $c['client_id'],
        'redirect_uri'          => $c['redirect_uri'],
        'response_type'         => 'code',
        'scope'                 => GOOGLE_SCOPES,
        'access_type'           => 'offline',  // vogliamo anche il refresh token (per non chiederti di ricollegarti ogni ora)
        'prompt'                => 'consent',  // ...e Google lo dà solo se mostra di nuovo la schermata di consenso
        'include_granted_scopes' => 'true',
        'state'                 => $state,
        'code_challenge'        => $challenge,
        'code_challenge_method' => 'S256',
    ]);
}

/** GET /google/callback?code=...&state=...  -> qui ci rimanda Google dopo che hai autorizzato (o rifiutato). */
function handle_google_callback(): never
{
    $state = is_string($_GET['state'] ?? null) ? $_GET['state'] : '';
    $fallbackReturn = google_safe_return_url(null);

    // il biglietto deve esistere, essere recente, e si usa UNA volta sola (lo cancello subito)
    $stmt = db()->prepare('SELECT * FROM dashboard_oauth_states WHERE state_hash = ? AND created_at >= ?');
    $stmt->execute([hash('sha256', $state), gmdate('Y-m-d H:i:s', time() - GOOGLE_STATE_TTL)]);
    $saved = $stmt->fetch();
    db()->prepare('DELETE FROM dashboard_oauth_states WHERE state_hash = ?')->execute([hash('sha256', $state)]);

    if ($saved === false) {
        redirect_with_query($fallbackReturn, ['google' => 'error', 'reason' => 'expired']);
    }
    $returnUrl = $saved['return_url'];
    $userId = (int) $saved['user_id'];

    if (isset($_GET['error'])) { // es. "access_denied": hai premuto Annulla su Google
        redirect_with_query($returnUrl, ['google' => 'denied']);
    }
    $code = is_string($_GET['code'] ?? null) ? $_GET['code'] : '';
    if ($code === '') {
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'no_code']);
    }

    // scambio il code con i token (da server a server: qui serve il client_secret)
    $c = google_config();
    [$status, $tokens] = http_json('POST', $c['token_url'], ['Accept: application/json'], [
        'code'          => $code,
        'client_id'     => $c['client_id'],
        'client_secret' => $c['client_secret'],
        'redirect_uri'  => $c['redirect_uri'],
        'grant_type'    => 'authorization_code',
        'code_verifier' => $saved['code_verifier'],
    ]);
    if ($status !== 200 || !isset($tokens['access_token'])) {
        error_log('Google token: HTTP ' . $status . ' ' . ($tokens['error'] ?? ''));
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'token']);
    }

    // Su Google si può togliere la spunta ai singoli permessi: controllo di avere davvero quello del calendario
    $granted = explode(' ', (string) ($tokens['scope'] ?? ''));
    if (!in_array(GOOGLE_CALENDAR_SCOPE, $granted, true)) {
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'scope']);
    }

    // il refresh token Google lo manda di solito solo la prima volta: se manca, tengo quello già salvato
    $existing = google_account($userId);
    $refreshToken = $tokens['refresh_token'] ?? null;
    if ($refreshToken === null && $existing === null) {
        redirect_with_query($returnUrl, ['google' => 'error', 'reason' => 'no_refresh']);
    }
    $refreshEncrypted = $refreshToken !== null
        ? encrypt_secret($refreshToken, GOOGLE_TOKEN_PURPOSE)
        : $existing['refresh_token'];

    $now = now_utc();
    db()->prepare(
        'INSERT INTO dashboard_google_accounts
            (user_id, google_email, refresh_token, access_token, access_expires_at, selected_calendars, connected_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
         ON DUPLICATE KEY UPDATE
            google_email = VALUES(google_email),
            refresh_token = VALUES(refresh_token),
            access_token = VALUES(access_token),
            access_expires_at = VALUES(access_expires_at),
            updated_at = VALUES(updated_at)'
    )->execute([
        $userId,
        google_email_from_id_token($tokens['id_token'] ?? null),
        $refreshEncrypted,
        encrypt_secret($tokens['access_token'], GOOGLE_TOKEN_PURPOSE),
        gmdate('Y-m-d H:i:s', time() + (int) ($tokens['expires_in'] ?? 3600)),
        $now,
        $now,
    ]);

    redirect_with_query($returnUrl, ['google' => 'connected']);
}

/** DELETE /google  -> scollega: chiede a Google di revocare il permesso e cancella i token */
function handle_google_disconnect(): never
{
    $user = require_user();
    $account = google_account($user['id']);
    if ($account !== null) {
        try {
            $token = decrypt_secret($account['refresh_token'], GOOGLE_TOKEN_PURPOSE);
            http_request('POST', google_config()['revoke_url'], [], ['token' => $token]); // "meglio se riesce", non blocca
        } catch (Throwable $e) {
            error_log('Google revoke: ' . $e->getMessage());
        }
        db()->prepare('DELETE FROM dashboard_google_accounts WHERE user_id = ?')->execute([$user['id']]);
    }
    no_content();
}

/** GET /google/calendars  -> i tuoi calendari, con quali hai scelto di vedere */
function handle_google_calendars(): never
{
    $user = require_user();
    $account = google_account($user['id']);
    if ($account === null) {
        json_response(['status' => 'not_connected', 'calendars' => []]);
    }

    try {
        $calendars = google_list_calendars($user['id']);
    } catch (GoogleReconnectNeeded) {
        json_response(['status' => 'reconnect', 'calendars' => []]);
    }

    $selected = google_selected_ids($account, $calendars);
    foreach ($calendars as &$calendar) {
        $calendar['selected'] = in_array($calendar['id'], $selected, true);
    }
    unset($calendar);

    json_response(['status' => 'ok', 'calendars' => $calendars]);
}

/** POST /google/calendars/selection  { "ids": ["...", "..."] }  -> quali calendari mostrare nell'Agenda */
function handle_google_calendar_selection(): never
{
    $user = require_user();
    if (google_account($user['id']) === null) {
        throw new HttpException(409, 'Google non è collegato');
    }

    $ids = read_json_body()['ids'] ?? null;
    if (!is_array($ids) || !array_is_list($ids) || count($ids) > GOOGLE_MAX_CALENDARS) {
        throw new HttpException(400, 'ids deve essere una lista');
    }
    foreach ($ids as $id) {
        if (!is_string($id) || $id === '' || strlen($id) > 255) {
            throw new HttpException(400, 'Identificativo di calendario non valido');
        }
    }

    db()->prepare('UPDATE dashboard_google_accounts SET selected_calendars = ?, updated_at = ? WHERE user_id = ?')
        ->execute([json_encode(array_values(array_unique($ids)), JSON_THROW_ON_ERROR), now_utc(), $user['id']]);
    json_response(['status' => 'ok']);
}

/** GET /google/events?days=7  -> gli eventi dei calendari scelti, da oggi per N giorni, in ordine */
function handle_google_events(): never
{
    $user = require_user();
    $account = google_account($user['id']);
    if ($account === null) {
        json_response(['status' => 'not_connected', 'events' => []]);
    }

    $days = filter_var($_GET['days'] ?? 7, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 31]]);
    if ($days === false) {
        throw new HttpException(400, 'days deve essere tra 1 e 31');
    }

    // da mezzanotte di oggi (ora italiana) per $days giorni
    $zone = new DateTimeZone(GOOGLE_TIMEZONE);
    $from = new DateTimeImmutable('today', $zone);
    $to = $from->modify("+$days days");

    try {
        $calendars = google_list_calendars($user['id']);
        $selected = google_selected_ids($account, $calendars);
        $byId = array_column($calendars, null, 'id');

        $events = [];
        foreach ($selected as $calendarId) {
            $calendar = $byId[$calendarId] ?? null;
            if ($calendar === null) {
                continue; // calendario non più accessibile (es. ti hanno tolto la condivisione)
            }
            $data = google_api_get($user['id'], 'calendars/' . rawurlencode($calendarId) . '/events', [
                'timeMin'      => $from->format(DATE_ATOM),
                'timeMax'      => $to->format(DATE_ATOM),
                'singleEvents' => 'true',       // gli eventi ricorrenti arrivano già "espansi" in singole date
                'orderBy'      => 'startTime',
                'timeZone'     => GOOGLE_TIMEZONE,
                'maxResults'   => 250,
                'fields'       => 'items(id,status,summary,location,htmlLink,start,end)', // solo quello che usiamo
            ]);
            foreach ($data['items'] ?? [] as $item) {
                if (($item['status'] ?? '') === 'cancelled') {
                    continue;
                }
                $allDay = isset($item['start']['date']);
                $events[] = [
                    'id'           => $calendarId . '/' . ($item['id'] ?? ''),
                    'calendarId'   => $calendarId,
                    'calendarName' => $calendar['name'],
                    'color'        => $calendar['color'],
                    'title'        => (string) ($item['summary'] ?? '(senza titolo)'),
                    'location'     => $item['location'] ?? null,
                    'link'         => $item['htmlLink'] ?? null,
                    'allDay'       => $allDay,
                    // tutto il giorno: 'YYYY-MM-DD' (la fine è ESCLUSA, come in Google); altrimenti data e ora ISO con fuso
                    'start'        => $allDay ? $item['start']['date'] : ($item['start']['dateTime'] ?? null),
                    'end'          => $allDay ? $item['end']['date'] : ($item['end']['dateTime'] ?? null),
                ];
            }
        }
    } catch (GoogleReconnectNeeded) {
        json_response(['status' => 'reconnect', 'events' => []]);
    }

    // in ordine di inizio (gli eventi "tutto il giorno" contano dalla mezzanotte e vengono prima)
    usort($events, fn (array $a, array $b) => [google_sort_time($a, $zone), $a['allDay'] ? 0 : 1]
        <=> [google_sort_time($b, $zone), $b['allDay'] ? 0 : 1]);

    json_response(['status' => 'ok', 'events' => $events]);
}

// --- Chiamate a Google ---

/** I calendari dell'utente: [{ id, name, color, primary }] */
function google_list_calendars(int $userId): array
{
    $data = google_api_get($userId, 'users/me/calendarList', [
        'minAccessRole' => 'reader',
        'fields'        => 'items(id,summary,summaryOverride,backgroundColor,primary)',
    ]);
    $calendars = [];
    foreach ($data['items'] ?? [] as $item) {
        $calendars[] = [
            'id'      => (string) $item['id'],
            // summaryOverride = il nome che gli hai dato TU (per i calendari condivisi da altri)
            'name'    => (string) ($item['summaryOverride'] ?? $item['summary'] ?? $item['id']),
            // il colore finisce in uno stile CSS nel browser: accetto solo '#rrggbb'
            'color'   => preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($item['backgroundColor'] ?? '')) === 1
                ? $item['backgroundColor']
                : '#888888',
            'primary' => (bool) ($item['primary'] ?? false),
        ];
    }
    return $calendars;
}

/** GET su Calendar API con il token dell'utente; se Google dice 401 rinnovo il token e riprovo una volta. */
function google_api_get(int $userId, string $path, array $query): array
{
    $url = google_config()['api_base'] . $path . '?' . http_build_query($query);
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        $token = google_access_token($userId, forceRefresh: $attempt === 2);
        [$status, $data] = http_json('GET', $url, ['Authorization: Bearer ' . $token, 'Accept: application/json']);
        if ($status === 200) {
            return $data;
        }
        if ($status !== 401) {
            error_log("Google API $path: HTTP $status " . json_encode($data['error'] ?? null));
            throw new HttpException(502, 'Google Calendar non ha risposto correttamente, riprova più tardi');
        }
    }
    throw new GoogleReconnectNeeded();
}

/**
 * Un access token valido. Durano circa un'ora: quando sta per scadere ne chiedo uno nuovo a Google
 * usando il refresh token. Se Google rifiuta il refresh token (revocato, scaduto) -> GoogleReconnectNeeded.
 */
function google_access_token(int $userId, bool $forceRefresh = false): string
{
    $account = google_account($userId) ?? throw new GoogleReconnectNeeded();

    $stillValid = $account['access_token'] !== null
        && $account['access_expires_at'] > gmdate('Y-m-d H:i:s', time() + 60);
    if ($stillValid && !$forceRefresh) {
        return decrypt_secret($account['access_token'], GOOGLE_TOKEN_PURPOSE);
    }

    $c = google_config();
    [$status, $tokens] = http_json('POST', $c['token_url'], ['Accept: application/json'], [
        'client_id'     => $c['client_id'],
        'client_secret' => $c['client_secret'],
        'refresh_token' => decrypt_secret($account['refresh_token'], GOOGLE_TOKEN_PURPOSE),
        'grant_type'    => 'refresh_token',
    ]);

    if ($status !== 200 || !isset($tokens['access_token'])) {
        if (($tokens['error'] ?? '') === 'invalid_grant') {
            // permesso revocato da Google, oppure (app in "Testing") refresh token scaduto dopo 7 giorni
            db()->prepare('DELETE FROM dashboard_google_accounts WHERE user_id = ?')->execute([$userId]);
            throw new GoogleReconnectNeeded();
        }
        error_log("Google refresh: HTTP $status " . ($tokens['error'] ?? ''));
        throw new HttpException(502, 'Google non risponde, riprova più tardi');
    }

    db()->prepare('UPDATE dashboard_google_accounts SET access_token = ?, access_expires_at = ?, updated_at = ? WHERE user_id = ?')
        ->execute([
            encrypt_secret($tokens['access_token'], GOOGLE_TOKEN_PURPOSE),
            gmdate('Y-m-d H:i:s', time() + (int) ($tokens['expires_in'] ?? 3600)),
            now_utc(),
            $userId,
        ]);
    return $tokens['access_token'];
}

// --- Dettagli interni ---

function google_account(int $userId): ?array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_google_accounts WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch() ?: null;
}

/** I calendari scelti; se non hai ancora scelto, quello principale. */
function google_selected_ids(array $account, array $calendars): array
{
    if ($account['selected_calendars'] !== null) {
        return json_decode($account['selected_calendars'], true) ?: [];
    }
    $primary = array_values(array_filter($calendars, fn (array $c) => $c['primary']));
    return $primary === [] ? [] : [$primary[0]['id']];
}

/**
 * L'indirizzo a cui tornare dopo Google, solo se inizia con uno di quelli ammessi in config.php.
 * Senza questo controllo chiunque potrebbe usare il nostro server per rimandare la gente su un sito falso ("open redirect").
 */
function google_safe_return_url(mixed $requested): string
{
    $allowed = google_config()['allowed_return_urls'];
    $default = ($allowed[0] ?? '/') . 'settings';
    if (!is_string($requested) || $requested === '') {
        return $default;
    }
    foreach ($allowed as $prefix) {
        if (str_starts_with($requested, $prefix)) {
            return $requested;
        }
    }
    return $default;
}

/**
 * L'email dall'id_token (un JWT: tre pezzi base64 separati da punti, il secondo contiene i dati).
 * Non ne verifico la firma perché l'ho ricevuto direttamente da Google su HTTPS, come prevede la sua documentazione.
 */
function google_email_from_id_token(?string $idToken): ?string
{
    $parts = explode('.', (string) $idToken);
    if (count($parts) !== 3) {
        return null;
    }
    $payload = json_decode((string) base64_decode(strtr($parts[1], '-_', '+/')), true);
    return is_array($payload) && is_string($payload['email'] ?? null) ? $payload['email'] : null;
}

function google_sort_time(array $event, DateTimeZone $zone): int
{
    return (new DateTimeImmutable((string) $event['start'], $zone))->getTimestamp();
}

function base64url_encode(string $bytes): string
{
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

/** Reindirizza il browser aggiungendo dei parametri all'indirizzo. */
function redirect_with_query(string $url, array $query): never
{
    $separator = str_contains($url, '?') ? '&' : '?';
    header('Location: ' . $url . $separator . http_build_query($query), true, 302);
    exit;
}
