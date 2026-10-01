<?php
// Modello della configurazione. Copialo in config.php e metti i valori veri.
// config.php NON va su git: contiene la password del database.
return [
    'db' => [
        'host'     => 'INDIRIZZO_DB_DAL_PANNELLO_ARUBA',
        'name'     => 'NOME_DATABASE',
        'user'     => 'UTENTE_DATABASE',
        'password' => 'PASSWORD_DATABASE',
    ],

    // Gli unici siti da cui accettiamo richieste che modificano dati.
    'allowed_origins' => ['https://www.gianlucadario.com'],

    'session' => [
        'cookie_name'   => 'dashboard_session',
        'cookie_path'   => '/extra/dashboard/api',
        'lifetime_days' => 30,
    ],

    // Serve solo a setup.php per creare il primo utente. Dopo, lasciala vuota.
    'setup_key' => '',
];
