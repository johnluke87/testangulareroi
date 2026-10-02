<?php
declare(strict_types=1);

const MAX_NOTES_PER_USER = 50;
const NOTE_BODY_MAX = 1000;

/** GET /notes */
function handle_list_notes(): never
{
    $user = require_user();
    json_response(list_notes($user['id']));
}

/** POST /notes  { "body": "..." } */
function handle_create_note(): never
{
    $user = require_user();
    $body = clean_text(read_json_body()['body'] ?? null, NOTE_BODY_MAX, required: true, field: 'La nota');

    $stmt = db()->prepare('SELECT COUNT(*) FROM dashboard_notes WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    if ((int) $stmt->fetchColumn() >= MAX_NOTES_PER_USER) {
        throw new HttpException(400, 'Puoi avere al massimo ' . MAX_NOTES_PER_USER . ' note');
    }

    $now = now_utc();
    db()->prepare('INSERT INTO dashboard_notes (user_id, body, created_at, updated_at) VALUES (?, ?, ?, ?)')
        ->execute([$user['id'], $body, $now, $now]);

    json_response(list_notes($user['id']), 201);
}

/** DELETE /notes/{id} */
function handle_delete_note(string $id): never
{
    $user = require_user();
    $stmt = db()->prepare('DELETE FROM dashboard_notes WHERE id = ? AND user_id = ?');
    $stmt->execute([(int) $id, $user['id']]);
    if ($stmt->rowCount() === 0) {
        throw new HttpException(404, 'Nota non trovata');
    }
    no_content();
}

function list_notes(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_notes WHERE user_id = ? ORDER BY id DESC');
    $stmt->execute([$userId]);
    return array_map(fn (array $row) => [
        'id'        => (int) $row['id'],
        'body'      => $row['body'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ], $stmt->fetchAll());
}
