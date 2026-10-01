<?php
declare(strict_types=1);

const TASK_SLOTS = ['morning', 'afternoon', 'evening'];
const TASK_PRIORITIES = [1, 2, 3]; // 1 = alta, 2 = media, 3 = bassa
const TASK_TITLE_MAX = 200;
const TASK_NOTES_MAX = 5000;

// I soli campi che il client può mandare (nomi JSON, in camelCase come in Angular).
const TASK_INPUT_FIELDS = ['title', 'notes', 'priority', 'dueDate', 'dueSlot', 'completed'];

// Da fare prima dei fatti. Da fare: priorità, poi data (senza data in fondo), poi mattina/pomeriggio/sera.
// Fatti: dal più recente.
const TASK_ORDER_BY = "
    completed_at IS NOT NULL,
    CASE WHEN completed_at IS NULL THEN priority END,
    CASE WHEN completed_at IS NULL THEN due_date IS NULL END,
    CASE WHEN completed_at IS NULL THEN due_date END,
    CASE WHEN completed_at IS NULL THEN
        CASE due_slot WHEN 'morning' THEN 1 WHEN 'afternoon' THEN 2 WHEN 'evening' THEN 3 ELSE 4 END
    END,
    completed_at DESC,
    id
";

// --- Handler delle rotte ---

/** GET /tasks?status=open|done|all */
function handle_list_tasks(): never
{
    $user = require_user();

    // Il pezzo di SQL viene SOLO da questi valori fissi, mai dal testo dell'utente.
    $filter = match ($_GET['status'] ?? 'all') {
        'open'  => 'AND completed_at IS NULL',
        'done'  => 'AND completed_at IS NOT NULL',
        'all'   => '',
        default => throw new HttpException(400, 'status deve essere open, done o all'),
    };

    $stmt = db()->prepare(
        "SELECT * FROM dashboard_tasks WHERE user_id = ? $filter ORDER BY " . TASK_ORDER_BY
    );
    $stmt->execute([$user['id']]);

    json_response(array_map('task_to_json', $stmt->fetchAll()));
}

/** GET /tasks/{id} */
function handle_get_task(string $id): never
{
    $user = require_user();
    json_response(task_to_json(find_task($user['id'], (int) $id)));
}

/** POST /tasks  { "title": "...", "priority": 1, "dueDate": "2026-10-02", "dueSlot": "morning", ... } */
function handle_create_task(): never
{
    $user = require_user();
    $columns = validate_task_input(read_json_body(), null);

    $now = now_utc();
    $columns += ['user_id' => $user['id'], 'created_at' => $now, 'updated_at' => $now];

    // I nomi delle colonne vengono da validate_task_input (stringhe fisse), i valori vanno come parametri "?".
    $names = array_keys($columns);
    $placeholders = implode(', ', array_fill(0, count($names), '?'));
    db()->prepare('INSERT INTO dashboard_tasks (' . implode(', ', $names) . ") VALUES ($placeholders)")
        ->execute(array_values($columns));

    $task = find_task($user['id'], (int) db()->lastInsertId());
    json_response(task_to_json($task), 201);
}

/** PATCH /tasks/{id}  solo i campi da cambiare, es. { "completed": true } oppure { "dueDate": "2026-10-03" } */
function handle_update_task(string $id): never
{
    $user = require_user();
    $existing = find_task($user['id'], (int) $id);
    $columns = validate_task_input(read_json_body(), $existing);

    if ($columns !== []) {
        $columns['updated_at'] = now_utc();
        $set = implode(', ', array_map(fn (string $name) => "$name = ?", array_keys($columns)));
        db()->prepare("UPDATE dashboard_tasks SET $set WHERE id = ? AND user_id = ?")
            ->execute([...array_values($columns), $existing['id'], $user['id']]);
    }

    json_response(task_to_json(find_task($user['id'], (int) $existing['id'])));
}

/** DELETE /tasks/{id} */
function handle_delete_task(string $id): never
{
    $user = require_user();
    $stmt = db()->prepare('DELETE FROM dashboard_tasks WHERE id = ? AND user_id = ?');
    $stmt->execute([(int) $id, $user['id']]);

    if ($stmt->rowCount() === 0) {
        throw new HttpException(404, 'Task non trovato');
    }
    no_content();
}

// --- Dettagli interni ---

/** Il task, solo se è dell'utente indicato: un task di altri risulta "non trovato". */
function find_task(int $userId, int $taskId): array
{
    $stmt = db()->prepare('SELECT * FROM dashboard_tasks WHERE id = ? AND user_id = ?');
    $stmt->execute([$taskId, $userId]);
    return $stmt->fetch() ?: throw new HttpException(404, 'Task non trovato');
}

/** Riga del database (snake_case) -> JSON per Angular (camelCase, date ISO in UTC). */
function task_to_json(array $row): array
{
    return [
        'id'          => (int) $row['id'],
        'title'       => $row['title'],
        'notes'       => $row['notes'],
        'priority'    => (int) $row['priority'],
        'dueDate'     => $row['due_date'],
        'dueSlot'     => $row['due_slot'],
        'completedAt' => utc_to_iso($row['completed_at']),
        'createdAt'   => utc_to_iso($row['created_at']),
        'updatedAt'   => utc_to_iso($row['updated_at']),
    ];
}

/**
 * Controlla i dati in arrivo e li trasforma in colonne del database.
 * $existing = null per un task nuovo (titolo obbligatorio), oppure la riga attuale per una modifica.
 * Restituisce solo le colonne da scrivere.
 */
function validate_task_input(array $body, ?array $existing): array
{
    $unknown = array_diff(array_keys($body), TASK_INPUT_FIELDS);
    if ($unknown !== []) {
        throw new HttpException(400, 'Campo non previsto: ' . implode(', ', $unknown));
    }

    $columns = [];

    if ($existing === null || array_key_exists('title', $body)) {
        $title = is_string($body['title'] ?? null) ? trim($body['title']) : '';
        if ($title === '' || mb_strlen($title) > TASK_TITLE_MAX) {
            throw new HttpException(400, 'Il titolo è obbligatorio (massimo ' . TASK_TITLE_MAX . ' caratteri)');
        }
        $columns['title'] = $title;
    }

    if (array_key_exists('notes', $body)) {
        $notes = $body['notes'];
        if ($notes !== null && (!is_string($notes) || mb_strlen($notes) > TASK_NOTES_MAX)) {
            throw new HttpException(400, 'Le note possono avere al massimo ' . TASK_NOTES_MAX . ' caratteri');
        }
        $notes = $notes === null ? '' : trim($notes);
        $columns['notes'] = $notes === '' ? null : $notes;
    }

    if (array_key_exists('priority', $body)) {
        if (!in_array($body['priority'], TASK_PRIORITIES, true)) {
            throw new HttpException(400, 'La priorità deve essere 1 (alta), 2 (media) o 3 (bassa)');
        }
        $columns['priority'] = $body['priority'];
    }

    if (array_key_exists('dueDate', $body)) {
        $date = $body['dueDate'];
        if ($date !== null && !is_valid_date($date)) {
            throw new HttpException(400, 'La data deve essere nel formato AAAA-MM-GG');
        }
        $columns['due_date'] = $date;
    }

    if (array_key_exists('dueSlot', $body)) {
        $slot = $body['dueSlot'];
        if ($slot !== null && !in_array($slot, TASK_SLOTS, true)) {
            throw new HttpException(400, 'Il momento deve essere morning, afternoon o evening');
        }
        $columns['due_slot'] = $slot;
    }

    if (array_key_exists('completed', $body)) {
        if (!is_bool($body['completed'])) {
            throw new HttpException(400, 'completed deve essere true o false');
        }
        $alreadyDone = $existing !== null && $existing['completed_at'] !== null;
        if ($body['completed'] && !$alreadyDone) {
            $columns['completed_at'] = now_utc(); // la data di chiusura la decide il server
        } elseif (!$body['completed']) {
            $columns['completed_at'] = null;      // riaperto
        }
    }

    // Coerenza: mattina/pomeriggio/sera hanno senso solo con una data.
    $finalDate = array_key_exists('due_date', $columns) ? $columns['due_date'] : ($existing['due_date'] ?? null);
    $finalSlot = array_key_exists('due_slot', $columns) ? $columns['due_slot'] : ($existing['due_slot'] ?? null);
    if ($finalDate === null && $finalSlot !== null) {
        if (array_key_exists('due_date', $columns) && !array_key_exists('due_slot', $columns)) {
            $columns['due_slot'] = null; // hai tolto la data: tolgo anche il momento
        } else {
            throw new HttpException(400, 'Per scegliere mattina, pomeriggio o sera serve una data');
        }
    }

    return $columns;
}

function is_valid_date(mixed $value): bool
{
    return is_string($value)
        && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m) === 1
        && checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}
