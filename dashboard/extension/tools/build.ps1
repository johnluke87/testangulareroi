# Crea i pacchetti da caricare negli store:
#   dist\edge\     + dist\setup-pagina-nuova-scheda-edge-<versione>.zip
#   dist\firefox\  + dist\setup-pagina-nuova-scheda-firefox-<versione>.zip
# Uso:  powershell -ExecutionPolicy Bypass -File tools\build.ps1
#
# Il codice è lo stesso (cartella src); cambia solo il manifest:
# Firefox vuole in più "browser_specific_settings" (identificativo dell'estensione e dati raccolti).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'src'
$dist = Join-Path $root 'dist'
$utf8 = New-Object System.Text.UTF8Encoding $false   # UTF-8 SENZA BOM: alcuni browser rifiutano il BOM nel manifest

$manifest = Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version

if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory $dist | Out-Null

function New-Package([string]$name, $manifestObject) {
    $folder = Join-Path $dist $name
    Copy-Item $src $folder -Recurse
    [System.IO.File]::WriteAllText((Join-Path $folder 'manifest.json'), ($manifestObject | ConvertTo-Json -Depth 10), $utf8)

    # zip con i percorsi separati da "/" (lo standard): lo Compress-Archive di Windows PowerShell 5 usa "\"
    # e Firefox rifiuta il pacchetto. Il manifest deve stare nella RADICE dello zip, non in una sottocartella.
    $zipPath = Join-Path $dist "setup-pagina-nuova-scheda-$name-$version.zip"
    $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem $folder -Recurse -File | ForEach-Object {
            $entry = $_.FullName.Substring($folder.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entry) | Out-Null
        }
    } finally {
        $zip.Dispose()
    }
    Write-Output "pronto: $zipPath"
}

# Edge (e Chrome): il manifest così com'è
New-Package 'edge' $manifest

# Firefox: stesso manifest + impostazioni specifiche di Gecko (il motore di Firefox)
$firefox = Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json
$firefox | Add-Member -NotePropertyName 'browser_specific_settings' -NotePropertyValue ([ordered]@{
    gecko = [ordered]@{
        # identificativo unico e permanente dell'estensione su addons.mozilla.org: NON cambiarlo dopo la prima pubblicazione
        id = 'setup-pagina-nuova-scheda@gianlucadario.com'
        # 142: prima versione (anche su Android) che capisce "data_collection_permissions"
        strict_min_version = '142.0'
        # dichiarazione obbligatoria per le nuove estensioni: non raccogliamo nessun dato
        data_collection_permissions = [ordered]@{ required = @('none') }
    }
})
New-Package 'firefox' $firefox
