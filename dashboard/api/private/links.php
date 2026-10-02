<?php
declare(strict_types=1);

const MAX_LINKS_PER_USER = 30;
const LINK_LABEL_MAX = 80;
const LINK_URL_MAX = 500;

/** GET /links */
function handle_list_links(): never
{
    $user = require_user();
    json_response(list_links($user['id']));
}

/** POST /links  { "label": "Mail", "url": "https://..." } */
function handle_create_link(): never
{
    $user = require_user();
    $input = read_json_body();
    $label = clean_text($input['label'] ?? null, LINK_LABEL_MAX, required: true, field: 'Il nome');
    $url = link_url($input['url'] ?? null);

    $stmt = db()->prepare('SELECT COUNT(*), COALESCE(MAX(position), -1) FROM dashboard_links WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    [$count, $maxPosition] = $stmt->fetch(PDO::FETCH_NUM);
    if ((int) $count >= MAX_LINKS_PER_USER) {
        throw new HttpException(400, 'Puoi avere al massimo ' . MAX_LINKS_PER_USER . ' link');
    }

    db()->prepare('INSERT INTO dashboard_links (user_id, label, url, position, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$user['id'], $label, $url, (int) $maxPosition + 1, now_utc()]);

    json_response(list_links($user['id']), 201);
}

/** DELETE /links/{id} */
function handle_delete_link(string $id): never
{
    $user = require_user();
    $stmt = db()->prepare('DELETE FROM dashboard_links WHERE id = ? AND user_id = ?');
    $stmt->execute([(int) $id, $user['id']]);
    if ($stmt->rowCount() === 0) {
        throw new HttpException(404, 'Link non trovato');
    }
    no_content();
}

function list_links(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_links WHERE user_id = ? ORDER BY position, id');
    $stmt->execute([$userId]);
    return array_map(fn (array $row) => [
        'id'    => (int) $row['id'],
        'label' => $row['label'],
        'url'   => $row['url'],
    ], $stmt->fetchAll());
}

/** Solo http e https. Se manca lo schema, aggiunge https:// */
function link_url(mixed $value): string
{
    if (!is_string($value) || trim($value) === '') {
        throw new HttpException(400, "L'indirizzo è obbligatorio");
    }
    $url = trim($value);
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    if (mb_strlen($url) > LINK_URL_MAX || filter_var($url, FILTER_VALIDATE_URL) === false) {
        throw new HttpException(400, "L'indirizzo non è valido");
    }
    $scheme = parse_url($url, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new HttpException(400, "L'indirizzo non è valido");
    }
    return $url;
}
