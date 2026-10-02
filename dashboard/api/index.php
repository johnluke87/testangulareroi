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
// Ogni handler (tranne health, login e register) chiama require_user(): senza sessione valida risponde 401.
$routes = [
    ['GET',    '#^/health$#',          'handle_health'],

    ['POST',   '#^/auth/login$#',      'handle_login'],
    ['POST',   '#^/auth/register$#',   'handle_register'],
    ['POST',   '#^/auth/logout$#',     'handle_logout'],
    ['GET',    '#^/auth/me$#',         'handle_me'],

    ['GET',    '#^/settings$#',        'handle_get_settings'],
    ['PATCH',  '#^/settings$#',        'handle_update_settings'],

    ['GET',    '#^/places$#',          'handle_list_places'],
    ['POST',   '#^/places$#',          'handle_add_place'],
    ['POST',   '#^/places/order$#',    'handle_reorder_places'],
    ['DELETE', '#^/places/(\d+)$#',    'handle_delete_place'],

    ['GET',    '#^/games/hot$#',        'handle_bgg_hot'],
    ['GET',    '#^/games/collection$#', 'handle_bgg_collection'],

    ['GET',    '#^/google/status$#',              'handle_google_status'],
    ['GET',    '#^/google/connect$#',             'handle_google_connect'],   // navigazione del browser
    ['GET',    '#^/google/callback$#',            'handle_google_callback'],  // qui torna Google (senza cookie)
    ['DELETE', '#^/google$#',                     'handle_google_disconnect'],
    ['GET',    '#^/google/calendars$#',           'handle_google_calendars'],
    ['POST',   '#^/google/calendars/selection$#', 'handle_google_calendar_selection'],
    ['GET',    '#^/google/events$#',              'handle_google_events'],

    ['GET',    '#^/tuya/config$#',    'handle_tuya_get_config'],
    ['POST',   '#^/tuya/config$#',    'handle_tuya_save_config'],
    ['DELETE', '#^/tuya/config$#',    'handle_tuya_delete_config'],
    ['GET',    '#^/tuya/devices$#',   'handle_tuya_devices'],
    ['POST',   '#^/tuya/devices/([A-Za-z0-9]{1,64})/command$#', 'handle_tuya_command'],

    ['GET',    '#^/news/feeds$#',     'handle_news_feeds'],
    ['GET',    '#^/news$#',           'handle_news'],

    ['GET',    '#^/notes$#',          'handle_list_notes'],
    ['POST',   '#^/notes$#',          'handle_create_note'],
    ['DELETE', '#^/notes/(\d+)$#',    'handle_delete_note'],

    ['GET',    '#^/links$#',          'handle_list_links'],
    ['POST',   '#^/links$#',          'handle_create_link'],
    ['DELETE', '#^/links/(\d+)$#',    'handle_delete_link'],

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
