<?php
declare(strict_types=1);

// Le località preferite del meteo, una lista per utente, nell'ordine scelto da lui.
const MAX_PLACES_PER_USER = 30;

/** GET /places */
function handle_list_places(): never
{
    $user = require_user();
    json_response(list_places($user['id']));
}

/** POST /places  { "id": "3181730", "name": "Bormio", "region": "Lombardia", "country": "Italia", "latitude": 46.47, "longitude": 10.37 } */
function handle_add_place(): never
{
    $user = require_user();
    $body = read_json_body();

    // "id" è l'identificativo della località per Angular (id del geocoding o "lat,lon" per la posizione attuale)
    $placeKey = $body['id'] ?? null;
    if (!is_string($placeKey) || preg_match('/^[A-Za-z0-9.,_-]{1,64}$/', $placeKey) !== 1) {
        throw new HttpException(400, 'Identificativo della località non valido');
    }
    $name = clean_text($body['name'] ?? null, 100, required: true, field: 'Il nome');
    $region = clean_text($body['region'] ?? null, 100, required: false, field: 'La regione');
    $country = clean_text($body['country'] ?? null, 100, required: false, field: 'Il paese');
    $latitude = coordinate($body['latitude'] ?? null, 90, 'Latitudine');
    $longitude = coordinate($body['longitude'] ?? null, 180, 'Longitudine');

    // già nei preferiti? Non è un errore: restituisco la lista com'è
    $stmt = db()->prepare('SELECT id FROM dashboard_favorite_places WHERE user_id = ? AND place_key = ?');
    $stmt->execute([$user['id'], $placeKey]);
    if ($stmt->fetch() !== false) {
        json_response(list_places($user['id']));
    }

    $stmt = db()->prepare('SELECT COUNT(*), COALESCE(MAX(position), -1) FROM dashboard_favorite_places WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    [$count, $maxPosition] = $stmt->fetch(PDO::FETCH_NUM);
    if ((int) $count >= MAX_PLACES_PER_USER) {
        throw new HttpException(400, 'Puoi avere al massimo ' . MAX_PLACES_PER_USER . ' località');
    }

    db()->prepare(
        'INSERT INTO dashboard_favorite_places
            (user_id, place_key, name, region, country, latitude, longitude, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([$user['id'], $placeKey, $name, $region, $country, $latitude, $longitude, (int) $maxPosition + 1, now_utc()]);

    json_response(list_places($user['id']), 201);
}

/** DELETE /places/{favoriteId} */
function handle_delete_place(string $id): never
{
    $user = require_user();
    $stmt = db()->prepare('DELETE FROM dashboard_favorite_places WHERE id = ? AND user_id = ?');
    $stmt->execute([(int) $id, $user['id']]);
    if ($stmt->rowCount() === 0) {
        throw new HttpException(404, 'Località non trovata');
    }
    no_content();
}

/** POST /places/order  { "ids": [3, 1, 2] }  = i favoriteId nel nuovo ordine */
function handle_reorder_places(): never
{
    $user = require_user();
    $ids = read_json_body()['ids'] ?? null;
    if (!is_array($ids) || !array_is_list($ids) || count($ids) > MAX_PLACES_PER_USER) {
        throw new HttpException(400, 'ids deve essere una lista');
    }
    foreach ($ids as $id) {
        if (!is_int($id)) {
            throw new HttpException(400, 'ids deve contenere solo numeri');
        }
    }

    // transazione: o si aggiornano tutte le posizioni, o nessuna (niente liste "a metà")
    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE dashboard_favorite_places SET position = ? WHERE id = ? AND user_id = ?');
    foreach ($ids as $position => $id) {
        $stmt->execute([$position, $id, $user['id']]); // "AND user_id": non puoi spostare le località di altri
    }
    $pdo->commit();

    json_response(list_places($user['id']));
}

// --- Dettagli interni ---

function list_places(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_favorite_places WHERE user_id = ? ORDER BY position, id');
    $stmt->execute([$userId]);
    return array_map(fn (array $r) => [
        'favoriteId' => (int) $r['id'],
        'id'         => $r['place_key'],
        'name'       => $r['name'],
        'region'     => $r['region'],
        'country'    => $r['country'],
        'latitude'   => (float) $r['latitude'],
        'longitude'  => (float) $r['longitude'],
    ], $stmt->fetchAll());
}

/** Testo ripulito: obbligatorio o facoltativo (null), con lunghezza massima. */
function clean_text(mixed $value, int $max, bool $required, string $field): ?string
{
    if ($value === null || $value === '') {
        if ($required) {
            throw new HttpException(400, "$field è obbligatorio");
        }
        return null;
    }
    if (!is_string($value) || mb_strlen(trim($value)) > $max) {
        throw new HttpException(400, "$field non è valido (massimo $max caratteri)");
    }
    return trim($value);
}

function coordinate(mixed $value, int $limit, string $field): float
{
    if (!is_int($value) && !is_float($value) || abs($value) > $limit) {
        throw new HttpException(400, "$field non valida");
    }
    return (float) $value;
}
