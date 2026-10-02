<?php
declare(strict_types=1);

/*
 * BoardGameGeek (XML API2), usato SOLO dal server:
 *  - il token BGG (config.php: bgg_token) non arriva mai al browser;
 *  - le risposte vengono trasformate da XML a JSON semplice e messe in cache nel database,
 *    così chiediamo a BGG il meno possibile (lo chiedono loro: rispondono 429 a chi esagera).
 */

const BGG_DEFAULT_BASE_URL = 'https://boardgamegeek.com/xmlapi2/';
const BGG_HOT_TTL = 3600;              // giochi del momento: 1 ora
const BGG_COLLECTION_TTL = 6 * 3600;   // collezione di un utente: 6 ore

// --- Handler delle rotte ---

/** GET /games/hot  -> i giochi più chiacchierati del momento su BGG */
function handle_bgg_hot(): never
{
    require_user();

    $fresh = bgg_cache_get('hot', BGG_HOT_TTL);
    if ($fresh !== null) {
        json_response(['status' => 'ok', 'games' => $fresh]);
    }

    [$status, $body] = bgg_fetch('hot', ['type' => 'boardgame']);
    if ($status !== 200) {
        bgg_respond_stale_or_fail('hot', $status);
    }

    $games = [];
    foreach (bgg_parse_xml($body)->item as $item) {
        $games[] = [
            'id'        => (int) $item['id'],
            'rank'      => (int) $item['rank'],
            'name'      => (string) $item->name['value'],
            'year'      => isset($item->yearpublished) ? (int) $item->yearpublished['value'] : null,
            'thumbnail' => (string) $item->thumbnail['value'] ?: null,
        ];
    }

    bgg_cache_put('hot', $games);
    json_response(['status' => 'ok', 'games' => $games]);
}

/**
 * GET /games/collection  -> i giochi POSSEDUTI dall'utente BGG scritto nelle impostazioni.
 * "status" dice ad Angular cosa mostrare:
 *   ok | no_username (non l'hai impostato) | pending (BGG la sta preparando: riprova) | invalid_username
 */
function handle_bgg_collection(): never
{
    $user = require_user();
    $username = read_settings($user['id'])['bggUsername'];
    if ($username === null) {
        json_response(['status' => 'no_username', 'games' => []]);
    }

    $cacheKey = 'collection:' . mb_strtolower($username);
    $fresh = bgg_cache_get($cacheKey, BGG_COLLECTION_TTL);
    if ($fresh !== null) {
        bgg_collection_response($fresh);
    }

    [$status, $body] = bgg_fetch('collection', [
        'username' => $username,
        'own'      => 1,                       // solo quelli che possiedi
        'stats'    => 1,                       // con giocatori, durata e voti
        'subtype'  => 'boardgame',
        'excludesubtype' => 'boardgameexpansion', // le espansioni non si giocano da sole
    ]);

    // 202 = "richiesta accettata, la preparo": è normale la prima volta, Angular riproverà tra qualche secondo
    if ($status === 202) {
        $stale = bgg_cache_get($cacheKey, null);
        if ($stale !== null) {
            bgg_collection_response($stale);
        }
        json_response(['status' => 'pending', 'games' => []]);
    }
    if ($status !== 200) {
        $stale = bgg_cache_get($cacheKey, null);
        if ($stale !== null) {
            bgg_collection_response($stale); // BGG ha problemi: meglio la copia vecchia che niente
        }
        bgg_respond_stale_or_fail($cacheKey, $status);
    }

    $xml = bgg_parse_xml($body);
    // nome utente inesistente: BGG risponde 200 ma con <errors><error><message>...</message></error></errors>
    if ($xml->getName() === 'errors') {
        json_response(['status' => 'invalid_username', 'games' => []]);
    }

    $games = [];
    foreach ($xml->item as $item) {
        $stats = $item->stats;
        $myRating = (string) $stats->rating['value']; // "N/A" se non l'hai votato
        $games[] = [
            'id'          => (int) $item['objectid'],
            'name'        => (string) $item->name,
            'year'        => isset($item->yearpublished) ? (int) $item->yearpublished : null,
            'thumbnail'   => (string) $item->thumbnail ?: null,
            'minPlayers'  => (int) $stats['minplayers'] ?: null,
            'maxPlayers'  => (int) $stats['maxplayers'] ?: null,
            'minTime'     => (int) $stats['minplaytime'] ?: null,
            'maxTime'     => (int) $stats['maxplaytime'] ?: null,
            'rating'      => round((float) $stats->rating->average['value'], 1) ?: null,
            'myRating'    => is_numeric($myRating) ? (float) $myRating : null,
            'numPlays'    => (int) $item->numplays,
        ];
    }
    usort($games, fn (array $a, array $b) => strcasecmp($a['name'], $b['name']));

    bgg_cache_put($cacheKey, $games);
    bgg_collection_response($games);
}

// --- Peso (complessità 1–5) ---
//
// La collezione di BGG NON contiene il peso: c'è solo nella scheda del singolo gioco (/thing?id=...&stats=1),
// che accetta al massimo 20 giochi per richiesta. Quindi: teniamo i pesi in cache (non scadono: il peso di un gioco
// cambia pochissimo) e, a ogni richiesta della collezione, scarichiamo al massimo 2 gruppi da 20 di quelli che mancano.
// Se ne mancano ancora, rispondiamo weightsPending: true e Angular richiede di nuovo dopo qualche secondo.

const BGG_THING_BATCH = 20;
const BGG_THING_BATCHES_PER_CALL = 2;
const BGG_WEIGHTS_KEY = 'weights';

/** Risponde con la collezione, aggiungendo a ogni gioco il suo peso (o null se non lo sappiamo ancora). */
function bgg_collection_response(array $games): never
{
    $weights = bgg_cache_get(BGG_WEIGHTS_KEY, null) ?? [];
    $missing = array_values(array_filter(
        array_map(fn (array $g) => $g['id'], $games),
        fn (int $id) => !array_key_exists((string) $id, $weights),
    ));

    $batches = array_slice(array_chunk($missing, BGG_THING_BATCH), 0, BGG_THING_BATCHES_PER_CALL);
    foreach ($batches as $index => $ids) {
        if ($index > 0) {
            sleep(2); // BGG chiede di non fare richieste a raffica
        }
        $fetched = bgg_fetch_weights($ids);
        if ($fetched === null) {
            break; // BGG occupato (429/202): riproveremo alla prossima richiesta
        }
        $weights = $fetched + $weights;
        $missing = array_values(array_diff($missing, $ids));
    }
    if ($batches !== []) {
        bgg_cache_put(BGG_WEIGHTS_KEY, $weights);
    }

    foreach ($games as &$game) {
        $game['weight'] = $weights[(string) $game['id']] ?? null;
    }
    unset($game);

    json_response(['status' => 'ok', 'games' => $games, 'weightsPending' => $missing !== []]);
}

/** I pesi di (al massimo 20) giochi: [ "13" => 2.3, ... ]. null se BGG non risponde ora. */
function bgg_fetch_weights(array $ids): ?array
{
    [$status, $body] = bgg_fetch('thing', ['id' => implode(',', $ids), 'stats' => 1]);
    if ($status !== 200) {
        return null;
    }
    $weights = [];
    foreach ($ids as $id) {
        $weights[(string) $id] = null; // se BGG non lo restituisce, segno comunque "chiesto" per non riprovare all'infinito
    }
    foreach (bgg_parse_xml($body)->item as $item) {
        $weight = round((float) $item->statistics->ratings->averageweight['value'], 1);
        $weights[(string) $item['id']] = $weight > 0 ? $weight : null; // 0 = nessuno l'ha votato
    }
    return $weights;
}

// --- Chiamate a BGG ---

/** Chiama BGG e restituisce [codice HTTP, corpo della risposta]. */
function bgg_fetch(string $path, array $query): array
{
    $token = (string) (config()['bgg_token'] ?? '');
    if ($token === '') {
        throw new HttpException(503, 'BoardGameGeek non è ancora configurato sul server (manca bgg_token)');
    }
    if (!function_exists('curl_init')) {
        error_log('BGG: estensione curl non disponibile');
        throw new HttpException(503, 'BoardGameGeek non è disponibile su questo server');
    }

    $baseUrl = (string) (config()['bgg_base_url'] ?? BGG_DEFAULT_BASE_URL);
    $curl = curl_init($baseUrl . $path . '?' . http_build_query($query));
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,          // dammi la risposta come stringa invece di stamparla
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token, 'Accept: application/xml'],
        CURLOPT_USERAGENT      => 'gianlucadario-dashboard/1.0',
    ]);
    $body = curl_exec($curl);

    if ($body === false) {
        error_log('BGG: ' . curl_error($curl));
        throw new HttpException(502, 'BoardGameGeek non risponde, riprova più tardi');
    }
    return [(int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE), (string) $body];
}

/** XML -> oggetto navigabile. LIBXML_NONET: il parser non scarica niente da internet (difesa contro XML malevoli). */
function bgg_parse_xml(string $body): SimpleXMLElement
{
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
    if ($xml === false) {
        error_log('BGG: XML non valido: ' . mb_substr($body, 0, 200));
        throw new HttpException(502, 'Risposta di BoardGameGeek non valida');
    }
    return $xml;
}

/** BGG ha risposto con un errore: se abbiamo una copia vecchia la usiamo, meglio di niente. */
function bgg_respond_stale_or_fail(string $cacheKey, int $status): never
{
    $stale = bgg_cache_get($cacheKey, null);
    if ($stale !== null) {
        json_response(['status' => 'ok', 'games' => $stale]);
    }
    error_log("BGG: risposta HTTP $status per $cacheKey");
    throw new HttpException(502, $status === 429
        ? 'BoardGameGeek è sovraccarico, riprova tra qualche minuto'
        : 'BoardGameGeek non ha risposto correttamente, riprova più tardi');
}

// --- Cache nel database (tabella dashboard_bgg_cache) ---

/** I dati in cache, se più recenti di $maxAgeSeconds (null = qualsiasi età). */
function bgg_cache_get(string $key, ?int $maxAgeSeconds): ?array
{
    $stmt = db()->prepare('SELECT payload, fetched_at FROM dashboard_bgg_cache WHERE cache_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if ($row === false) {
        return null;
    }
    if ($maxAgeSeconds !== null && $row['fetched_at'] < gmdate('Y-m-d H:i:s', time() - $maxAgeSeconds)) {
        return null;
    }
    return json_decode($row['payload'], true, 32, JSON_THROW_ON_ERROR);
}

function bgg_cache_put(string $key, array $data): void
{
    db()->prepare(
        'INSERT INTO dashboard_bgg_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = VALUES(fetched_at)'
    )->execute([$key, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), now_utc()]);
}
