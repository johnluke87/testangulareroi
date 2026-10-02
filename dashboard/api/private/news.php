<?php
declare(strict_types=1);

/*
 * Notizie dai feed RSS dell'ANSA, lette dal server.
 * Il browser non può leggere direttamente ansa.it (manca il permesso CORS), quindi passa da qui.
 *
 * SICUREZZA: si possono leggere SOLO i feed di questo elenco. Se accettassimo un indirizzo qualsiasi,
 * chiunque potrebbe usare il nostro server per scaricare pagine a caso ("SSRF").
 */

const NEWS_FEEDS = [
    'topnews'    => ['label' => 'Ultima ora',  'url' => 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml'],
    'primopiano' => ['label' => 'Primo piano', 'url' => 'https://www.ansa.it/sito/ansait_rss.xml'],
    'cronaca'    => ['label' => 'Cronaca',     'url' => 'https://www.ansa.it/sito/notizie/cronaca/cronaca_rss.xml'],
    'politica'   => ['label' => 'Politica',    'url' => 'https://www.ansa.it/sito/notizie/politica/politica_rss.xml'],
    'mondo'      => ['label' => 'Mondo',       'url' => 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml'],
    'economia'   => ['label' => 'Economia',    'url' => 'https://www.ansa.it/sito/notizie/economia/economia_rss.xml'],
    'sport'      => ['label' => 'Sport',       'url' => 'https://www.ansa.it/sito/notizie/sport/sport_rss.xml'],
    // NB: /sito/notizie/tecnologia/tecnologia_rss.xml è fermo al 2023: quello vivo è il "canale" tecnologia
    'tecnologia' => ['label' => 'Tecnologia',  'url' => 'https://www.ansa.it/canale_tecnologia/notizie/tecnologia_rss.xml'],
    'scienza'    => ['label' => 'Scienza',     'url' => 'https://www.ansa.it/canale_scienza_tecnica/notizie/scienzaetecnica_rss.xml'],
    'cultura'    => ['label' => 'Cultura',     'url' => 'https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml'],
    'motori'     => ['label' => 'Motori',      'url' => 'https://www.ansa.it/canale_motori/notizie/motori_rss.xml'],
];
const NEWS_TTL = 15 * 60;   // un feed lo riscarichiamo al massimo ogni 15 minuti, chiunque lo chieda
const NEWS_MAX_ITEMS = 15;

/** GET /news/feeds  -> l'elenco delle sezioni disponibili */
function handle_news_feeds(): never
{
    require_user();
    $feeds = [];
    foreach (NEWS_FEEDS as $id => $feed) {
        $feeds[] = ['id' => $id, 'label' => $feed['label']];
    }
    json_response($feeds);
}

/** GET /news?feed=topnews  -> le ultime notizie di quella sezione */
function handle_news(): never
{
    require_user();
    $feedId = is_string($_GET['feed'] ?? null) ? $_GET['feed'] : 'topnews';
    $feed = NEWS_FEEDS[$feedId] ?? throw new HttpException(400, 'Sezione di notizie sconosciuta');

    // stessa tabella di cache dei giochi (dashboard_bgg_cache): è una cache generica chiave -> JSON
    $cacheKey = 'news:' . $feedId;
    $fresh = bgg_cache_get($cacheKey, NEWS_TTL);
    if ($fresh !== null) {
        json_response(['feed' => $feedId, 'items' => $fresh]);
    }

    [$status, $body] = http_request('GET', $feed['url'], ['Accept: application/rss+xml, application/xml']);
    if ($status !== 200) {
        $stale = bgg_cache_get($cacheKey, null);
        if ($stale !== null) {
            json_response(['feed' => $feedId, 'items' => $stale]); // meglio le notizie di un'ora fa che niente
        }
        error_log("News $feedId: HTTP $status");
        throw new HttpException(502, 'ANSA non risponde, riprova più tardi');
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
    if ($xml === false || !isset($xml->channel)) {
        throw new HttpException(502, 'Il feed ANSA non è leggibile in questo momento');
    }

    $items = [];
    foreach ($xml->channel->item as $item) {
        $link = trim((string) $item->link);
        // il link finirà in un <a href>: accetto solo articoli ANSA in https (niente "javascript:" o siti estranei)
        if (!str_starts_with($link, 'https://www.ansa.it/')) {
            continue;
        }
        $published = strtotime((string) $item->pubDate);
        $items[] = [
            'title'       => html_entity_decode(trim((string) $item->title), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'summary'     => html_entity_decode(trim(strip_tags((string) $item->description)), ENT_QUOTES | ENT_HTML5, 'UTF-8') ?: null,
            'link'        => $link,
            'publishedAt' => $published === false ? null : gmdate('Y-m-d\TH:i:s\Z', $published),
        ];
        if (count($items) >= NEWS_MAX_ITEMS) {
            break;
        }
    }

    bgg_cache_put($cacheKey, $items);
    json_response(['feed' => $feedId, 'items' => $items]);
}
