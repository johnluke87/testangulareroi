<?php
declare(strict_types=1);

// Impostazioni personali di ogni utente (una riga per utente, creata alla prima modifica).

/** GET /settings */
function handle_get_settings(): never
{
    $user = require_user();
    json_response(read_settings($user['id']));
}

const SEARCH_ENGINES = ['google', 'duckduckgo', 'bing', 'ecosia', 'brave'];

/** PATCH /settings  { "bggUsername": "nome" | null, "searchEngine": "google" } */
function handle_update_settings(): never
{
    $user = require_user();
    $body = read_json_body();

    $unknown = array_diff(array_keys($body), ['bggUsername', 'searchEngine']);
    if ($unknown !== []) {
        throw new HttpException(400, 'Campo non previsto: ' . implode(', ', $unknown));
    }

    if (array_key_exists('bggUsername', $body)) {
        $bgg = $body['bggUsername'];
        if (is_string($bgg)) {
            $bgg = trim($bgg);
        }
        if ($bgg === '') {
            $bgg = null;
        }
        if ($bgg !== null && (!is_string($bgg) || preg_match('/^[A-Za-z0-9_. -]{1,50}$/', $bgg) !== 1)) {
            throw new HttpException(400, 'Nome utente BoardGameGeek non valido');
        }

        // INSERT ... ON DUPLICATE KEY UPDATE = "crea la riga se non c'è, altrimenti aggiornala" in una query sola
        db()->prepare(
            'INSERT INTO dashboard_user_settings (user_id, bgg_username, updated_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE bgg_username = VALUES(bgg_username), updated_at = VALUES(updated_at)'
        )->execute([$user['id'], $bgg, now_utc()]);
    }

    if (array_key_exists('searchEngine', $body)) {
        $engine = $body['searchEngine'];
        if (!is_string($engine) || !in_array($engine, SEARCH_ENGINES, true)) {
            throw new HttpException(400, 'Motore di ricerca non valido');
        }
        db()->prepare(
            'INSERT INTO dashboard_user_settings (user_id, search_engine, updated_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE search_engine = VALUES(search_engine), updated_at = VALUES(updated_at)'
        )->execute([$user['id'], $engine, now_utc()]);
    }

    json_response(read_settings($user['id']));
}

function read_settings(int $userId): array
{
    $stmt = db()->prepare('SELECT bgg_username, search_engine FROM dashboard_user_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    $engine = $row === false ? 'google' : $row['search_engine'];
    if (!in_array($engine, SEARCH_ENGINES, true)) {
        $engine = 'google';
    }
    return [
        'bggUsername'  => $row === false ? null : $row['bgg_username'],
        'searchEngine' => $engine,
    ];
}
