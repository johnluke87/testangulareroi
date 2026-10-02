<?php
declare(strict_types=1);

/**
 * Richieste HTTP dal NOSTRO server verso altri servizi (Google). Restituisce [codice HTTP, corpo].
 * $form = campi da mandare come form (application/x-www-form-urlencoded), come vuole l'endpoint dei token di Google.
 * $rawBody = corpo già pronto (es. JSON per i comandi Tuya); chi chiama mette anche l'header Content-Type.
 */
function http_request(string $method, string $url, array $headers = [], ?array $form = null, ?string $rawBody = null): array
{
    if (!function_exists('curl_init')) {
        error_log('HTTP: estensione curl non disponibile');
        throw new HttpException(503, 'Il server non può contattare servizi esterni');
    }

    $curl = curl_init($url);
    $options = [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_USERAGENT      => 'gianlucadario-dashboard/1.0',
    ];
    if ($form !== null) {
        $options[CURLOPT_POSTFIELDS] = http_build_query($form);
    } elseif ($rawBody !== null) {
        $options[CURLOPT_POSTFIELDS] = $rawBody;
    }
    curl_setopt_array($curl, $options);

    $body = curl_exec($curl);
    if ($body === false) {
        error_log("HTTP $method $url: " . curl_error($curl));
        throw new HttpException(502, 'Servizio esterno non raggiungibile, riprova più tardi');
    }
    return [(int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE), (string) $body];
}

/** Come http_request, ma decodifica la risposta JSON (array vuoto se non è JSON). */
function http_json(string $method, string $url, array $headers = [], ?array $form = null, ?string $rawBody = null): array
{
    [$status, $body] = http_request($method, $url, $headers, $form, $rawBody);
    $data = json_decode($body, true);
    return [$status, is_array($data) ? $data : []];
}
