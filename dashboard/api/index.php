<?php
declare(strict_types=1);

// L'UNICO punto d'ingresso dell'API: ogni richiesta passa di qui (grazie al .htaccess).
require __DIR__ . '/private/bootstrap.php';

send_security_headers();
require_https();
require_allowed_origin();

// Il percorso dopo ".../api", es. "/tasks/5"
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path = '/' . trim(substr($path, strlen($base)), '/');

// Le rotte: [metodo, espressione regolare del percorso, funzione da chiamare].
// I gruppi tra parentesi nella regex (l'id) diventano parametri della funzione.
// Ogni handler (tranne health e login) chiama require_user(): senza sessione valida risponde 401.
$routes = [
    ['GET',    '#^/health$#',          'handle_health'],

    ['POST',   '#^/auth/login$#',      'handle_login'],
    ['POST',   '#^/auth/logout$#',     'handle_logout'],
    ['GET',    '#^/auth/me$#',         'handle_me'],

    ['GET',    '#^/tasks$#',           'handle_list_tasks'],
    ['POST',   '#^/tasks$#',           'handle_create_task'],
    ['GET',    '#^/tasks/(\d+)$#',     'handle_get_task'],
    ['PATCH',  '#^/tasks/(\d+)$#',     'handle_update_task'],
    ['DELETE', '#^/tasks/(\d+)$#',     'handle_delete_task'],
];

$method = $_SERVER['REQUEST_METHOD'];
$pathExists = false;

foreach ($routes as [$routeMethod, $pattern, $handler]) {
    if (preg_match($pattern, $path, $matches) !== 1) {
        continue;
    }
    $pathExists = true;
    if ($routeMethod === $method) {
        $handler(...array_slice($matches, 1));
        exit;
    }
}

throw $pathExists
    ? new HttpException(405, 'Metodo non consentito')
    : new HttpException(404, 'Risorsa non trovata');

// --- Handler ---

/** Pubblico: dice solo se PHP e database rispondono. */
function handle_health(): never
{
    $dbTime = db()->query('SELECT NOW()')->fetchColumn();
    json_response(['status' => 'ok', 'dbTimeUtc' => $dbTime]);
}
