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

    // Chiunque può creare un account da /register. Metti false per chiudere le iscrizioni.
    'registration_open' => true,

    // Segreto dell'app (almeno 32 caratteri casuali): serve a "cifrare" gli IP nei limiti di tentativi
    // e, più avanti, i token di Google. Non cambiarlo dopo averlo messo.
    'app_secret' => 'METTI_QUI_UNA_STRINGA_CASUALE_LUNGA',

    // Abilita migrate.php (crea le tabelle). Dopo averlo eseguito, lasciala vuota.
    'maintenance_key' => '',

    // Token dell'applicazione registrata su https://boardgamegeek.com/applications (sezione "Tokens").
    // Vuoto = la card Giochi mostra "non configurato".
    'bgg_token' => '',

    // Google Calendar: dal progetto su Google Cloud (Google Auth Platform -> Clients -> client "Applicazione web").
    'google' => [
        'client_id'     => '',
        'client_secret' => '',
        // DEVE essere identico a "URI di reindirizzamento autorizzati" del client su Google Cloud
        'redirect_uri'  => 'https://www.gianlucadario.com/extra/dashboard/api/google/callback',
        // dove si può tornare dopo Google: l'app pubblicata e quella in sviluppo con ng serve
        'allowed_return_urls' => [
            'https://www.gianlucadario.com/extra/dashboard/',
            'http://localhost:4200/',
        ],
    ],
];
