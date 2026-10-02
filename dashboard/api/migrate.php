<?php
declare(strict_types=1);

/*
 * AGGIORNAMENTO DEL DATABASE — crea le tabelle che mancano.
 *
 * Si può eseguire più volte senza danni: ogni tabella è "CREATE TABLE IF NOT EXISTS",
 * quindi quelle che esistono già (con i tuoi dati) non vengono toccate.
 *
 * Protezioni:
 *  - funziona solo se in config.php c'è una 'maintenance_key' di almeno 20 caratteri;
 *  - chiede quella chiave nel form (la conosci solo tu);
 *  - solo HTTPS, solo dal nostro sito.
 * Quando hai finito, in config.php metti 'maintenance_key' => '' : lo script si disattiva da solo.
 */

require __DIR__ . '/private/bootstrap.php';

send_security_headers();
// pagina con un form: con "no-referrer" il browser manderebbe "Origin: null" e il controllo lo rifiuterebbe
header('Referrer-Policy: same-origin');
require_https();
require_allowed_origin();
header('Content-Type: text/html; charset=utf-8');

$OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

// Tutte le tabelle dell'app, nell'ordine giusto (prima quelle a cui le altre fanno riferimento).
// Tutte le date/ore sono in UTC.
$TABLES = [
    'dashboard_users' => "
        CREATE TABLE IF NOT EXISTS dashboard_users (
          id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          username       VARCHAR(50)  NOT NULL UNIQUE,
          password_hash  VARCHAR(255) NOT NULL,
          failed_logins  TINYINT UNSIGNED NOT NULL DEFAULT 0,
          locked_until   DATETIME NULL,
          created_at     DATETIME NOT NULL
        ) $OPTIONS",

    'dashboard_auth_tokens' => "
        CREATE TABLE IF NOT EXISTS dashboard_auth_tokens (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id       INT UNSIGNED NOT NULL,
          token_hash    CHAR(64) NOT NULL UNIQUE,
          created_at    DATETIME NOT NULL,
          expires_at    DATETIME NOT NULL,
          last_used_at  DATETIME NULL,
          user_agent    VARCHAR(255) NULL,
          CONSTRAINT fk_dashboard_tokens_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    'dashboard_tasks' => "
        CREATE TABLE IF NOT EXISTS dashboard_tasks (
          id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id       INT UNSIGNED NOT NULL,
          title         VARCHAR(200) NOT NULL,
          notes         TEXT NULL,
          priority      TINYINT UNSIGNED NOT NULL DEFAULT 2,
          due_date      DATE NULL,
          due_slot      ENUM('morning', 'afternoon', 'evening') NULL,
          completed_at  DATETIME NULL,
          created_at    DATETIME NOT NULL,
          updated_at    DATETIME NOT NULL,
          CONSTRAINT fk_dashboard_tasks_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE,
          INDEX idx_dashboard_tasks_user_open (user_id, completed_at, priority, due_date)
        ) $OPTIONS",

    // NUOVA: le località preferite del meteo, per utente e nel suo ordine
    'dashboard_favorite_places' => "
        CREATE TABLE IF NOT EXISTS dashboard_favorite_places (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id     INT UNSIGNED NOT NULL,
          place_key   VARCHAR(64)  NOT NULL,
          name        VARCHAR(100) NOT NULL,
          region      VARCHAR(100) NULL,
          country     VARCHAR(100) NULL,
          latitude    DECIMAL(9,6) NOT NULL,
          longitude   DECIMAL(9,6) NOT NULL,
          position    INT UNSIGNED NOT NULL DEFAULT 0,
          created_at  DATETIME NOT NULL,
          UNIQUE KEY uq_dashboard_places_user_key (user_id, place_key),
          CONSTRAINT fk_dashboard_places_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: impostazioni personali (per ora l'utente BoardGameGeek; poi Google)
    'dashboard_user_settings' => "
        CREATE TABLE IF NOT EXISTS dashboard_user_settings (
          user_id       INT UNSIGNED PRIMARY KEY,
          bgg_username   VARCHAR(50) NULL,
          search_engine  VARCHAR(20) NOT NULL DEFAULT 'google',
          updated_at     DATETIME NOT NULL,
          CONSTRAINT fk_dashboard_settings_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: copia delle risposte di BoardGameGeek (già trasformate in JSON), per non interrogarlo troppo spesso
    'dashboard_bgg_cache' => "
        CREATE TABLE IF NOT EXISTS dashboard_bgg_cache (
          cache_key   VARCHAR(120) NOT NULL PRIMARY KEY,
          payload     MEDIUMTEXT   NOT NULL,
          fetched_at  DATETIME     NOT NULL
        ) $OPTIONS",

    // NUOVA: i "biglietti" usa-e-getta del collegamento a Google (state + verifier PKCE), validi 15 minuti
    'dashboard_oauth_states' => "
        CREATE TABLE IF NOT EXISTS dashboard_oauth_states (
          state_hash     CHAR(64)     NOT NULL PRIMARY KEY,
          user_id        INT UNSIGNED NOT NULL,
          code_verifier  VARCHAR(128) NOT NULL,
          return_url     VARCHAR(500) NOT NULL,
          created_at     DATETIME     NOT NULL,
          CONSTRAINT fk_dashboard_oauth_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: l'account Google collegato da ogni utente; i token sono CIFRATI (crypto.php)
    'dashboard_google_accounts' => "
        CREATE TABLE IF NOT EXISTS dashboard_google_accounts (
          user_id             INT UNSIGNED PRIMARY KEY,
          google_email        VARCHAR(255) NULL,
          refresh_token       TEXT NOT NULL,
          access_token        TEXT NULL,
          access_expires_at   DATETIME NULL,
          selected_calendars  TEXT NULL,
          connected_at        DATETIME NOT NULL,
          updated_at          DATETIME NOT NULL,
          CONSTRAINT fk_dashboard_google_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: note veloci, una lista per utente
    'dashboard_notes' => "
        CREATE TABLE IF NOT EXISTS dashboard_notes (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id     INT UNSIGNED NOT NULL,
          body        VARCHAR(1000) NOT NULL,
          created_at  DATETIME NOT NULL,
          updated_at  DATETIME NOT NULL,
          CONSTRAINT fk_dashboard_notes_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE,
          INDEX idx_dashboard_notes_user (user_id, id)
        ) $OPTIONS",

    // NUOVA: link fissi, una lista per utente e nel suo ordine
    'dashboard_links' => "
        CREATE TABLE IF NOT EXISTS dashboard_links (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id     INT UNSIGNED NOT NULL,
          label       VARCHAR(80)  NOT NULL,
          url         VARCHAR(500) NOT NULL,
          position    INT UNSIGNED NOT NULL DEFAULT 0,
          created_at  DATETIME NOT NULL,
          CONSTRAINT fk_dashboard_links_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: la configurazione Tuya / Smart Life di ogni utente. Secret e token sono CIFRATI (crypto.php)
    'dashboard_tuya_accounts' => "
        CREATE TABLE IF NOT EXISTS dashboard_tuya_accounts (
          user_id           INT UNSIGNED PRIMARY KEY,
          region            VARCHAR(20)  NOT NULL,
          access_id         VARCHAR(64)  NOT NULL,
          access_secret     TEXT         NOT NULL,
          app_uid           VARCHAR(64)  NOT NULL,
          token             TEXT         NULL,
          token_expires_at  DATETIME     NULL,
          updated_at        DATETIME     NOT NULL,
          CONSTRAINT fk_dashboard_tuya_user
            FOREIGN KEY (user_id) REFERENCES dashboard_users(id) ON DELETE CASCADE
        ) $OPTIONS",

    // NUOVA: tentativi per IP (registrazione e login), con l'IP "cifrato" (HMAC), mai in chiaro
    'dashboard_rate_limits' => "
        CREATE TABLE IF NOT EXISTS dashboard_rate_limits (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          bucket      VARCHAR(32) NOT NULL,
          ip_hash     CHAR(64)    NOT NULL,
          created_at  DATETIME    NOT NULL,
          INDEX idx_dashboard_rate_limits_lookup (bucket, ip_hash, created_at)
        ) $OPTIONS",
];

$key = (string) (config()['maintenance_key'] ?? '');
$log = [];
$message = null;

if (strlen($key) < 20) {
    $message = "Script disattivato: in config.php non c'è una maintenance_key (almeno 20 caratteri).";
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($key, (string) ($_POST['maintenance_key'] ?? ''))) {
        $message = 'Chiave errata.';
    } else {
        // quali tabelle ci sono già? (per dire "creata" o "già presente")
        $existing = db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($TABLES as $name => $sql) {
            db()->exec($sql);
            $log[] = in_array($name, $existing, true) ? "$name: già presente" : "$name: CREATA";
        }
        // la tabella impostazioni può esistere già, senza la colonna del motore di ricerca
        $hasEngine = db()->query("SHOW COLUMNS FROM dashboard_user_settings LIKE 'search_engine'")->fetch();
        if ($hasEngine === false) {
            db()->exec("ALTER TABLE dashboard_user_settings ADD search_engine VARCHAR(20) NOT NULL DEFAULT 'google'");
            $log[] = 'dashboard_user_settings.search_engine: CREATA';
        } else {
            $log[] = 'dashboard_user_settings.search_engine: già presente';
        }
        $message = "Fatto. Ora in config.php metti 'maintenance_key' => '' per disattivare lo script.";
    }
}

$escape = fn (string $text): string => htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Dashboard · aggiornamento database</title>
</head>
<body>
  <h1>Aggiornamento database</h1>

  <?php if ($message !== null): ?>
    <p><strong><?= $escape($message) ?></strong></p>
  <?php endif; ?>

  <?php if ($log !== []): ?>
    <ul>
      <?php foreach ($log as $line): ?>
        <li><?= $escape($line) ?></li>
      <?php endforeach; ?>
    </ul>
  <?php elseif (strlen($key) >= 20): ?>
    <form method="post" autocomplete="off">
      <p><label>Maintenance key<br><input name="maintenance_key" type="password" required></label></p>
      <p><button type="submit">Crea le tabelle mancanti</button></p>
    </form>
  <?php endif; ?>
</body>
</html>
