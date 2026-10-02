<?php
declare(strict_types=1);

/*
 * Cifratura dei segreti che dobbiamo poter RILEGGERE (i token di Google).
 * Le password invece non si cifrano: si salva solo un hash, perché non serve mai rileggerle.
 *
 * La chiave è derivata da app_secret (config.php): senza config.php il contenuto del database è inutilizzabile.
 * Uso libsodium se c'è (il metodo moderno), altrimenti AES-256-GCM di OpenSSL. Il prefisso dice quale è stato usato.
 */

function secret_key(string $purpose): string
{
    // chiavi diverse per usi diversi, tutte ricavate dallo stesso app_secret
    return hash_hmac('sha256', $purpose, config()['app_secret'], true); // 32 byte
}

function encrypt_secret(string $plain, string $purpose): string
{
    $key = secret_key($purpose);
    if (function_exists('sodium_crypto_secretbox')) {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return 's1:' . base64_encode($nonce . sodium_crypto_secretbox($plain, $nonce, $key));
    }
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    return 'o1:' . base64_encode($iv . $tag . $cipher);
}

function decrypt_secret(string $stored, string $purpose): string
{
    $key = secret_key($purpose);
    $raw = base64_decode(substr($stored, 3), true);
    $plain = false;

    if ($raw !== false && str_starts_with($stored, 's1:') && function_exists('sodium_crypto_secretbox_open')) {
        $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), $nonce, $key);
    } elseif ($raw !== false && str_starts_with($stored, 'o1:')) {
        $plain = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    }

    if ($plain === false) {
        // succede se app_secret è stato cambiato: i token salvati prima non si possono più leggere
        throw new RuntimeException('Impossibile decifrare il segreto salvato');
    }
    return $plain;
}
