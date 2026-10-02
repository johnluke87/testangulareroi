# Setup Pagina Nuova Scheda — pubblicazione

Estensione che apre a ogni nuova scheda la pagina scelta dall'utente (configurabile).
Funziona su **Microsoft Edge** e **Firefox** (e Chrome, caricandola a mano).

## Struttura

```
extension/
├── src/            il codice dell'estensione (lo stesso per tutti i browser)
├── tools/
│   ├── build.ps1        crea i pacchetti in dist/
│   └── make-icons.ps1   rigenera le icone
├── store/logo-300.png   logo per lo store di Edge
└── dist/           (generata) i due zip da caricare
```

## Creare i pacchetti

```powershell
cd C:\progetti-angular\dashboard\extension
powershell -ExecutionPolicy Bypass -File tools\build.ps1
```

Risultato in `dist/`:
- `setup-pagina-nuova-scheda-edge-1.0.0.zip`
- `setup-pagina-nuova-scheda-firefox-1.0.0.zip`

**Nuova versione**: cambia `"version"` in `src/manifest.json` (es. `1.0.1`), rilancia `build.ps1`, carica il nuovo zip.
Gli store rifiutano uno zip con la stessa versione di uno già pubblicato.

## Provarla prima di pubblicarla

- **Edge**: `edge://extensions` → *Modalità sviluppatore* → *Carica decompressa* → cartella `dist\edge`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Carica componente aggiuntivo temporaneo* → `dist\firefox\manifest.json`
  (resta installata solo fino alla chiusura di Firefox).

Alla prima nuova scheda compare "Quale pagina vuoi aprire?". Per cambiarla dopo:
**Edge** → `edge://extensions` → *Dettagli* → *Opzioni estensione*; **Firefox** → `about:addons` → l'estensione → *Opzioni*.

## Screenshot (servono agli store)

Dopo averla caricata come sopra, apri la pagina **Opzioni** e fai uno screenshot della finestra
(Win + Maiusc + S). Dimensione consigliata **1280×800** (Edge accetta anche 640×480).
Due screenshot bastano: la pagina Opzioni e il modulo della prima nuova scheda.

---

## 1. Microsoft Edge Add-ons (gratis)

1. Vai su <https://partner.microsoft.com/dashboard/microsoftedge/overview> e accedi con un account Microsoft.
   La prima volta chiede di **registrarsi come sviluppatore Edge**: è gratuito (nome, email, paese).
2. **Create new extension** → carica `setup-pagina-nuova-scheda-edge-1.0.0.zip`.
3. **Availability**: *Public* (chiunque la trova) oppure *Hidden* (solo chi ha il link). Mercati: tutti, o solo Italia.
4. **Properties**:
   - Category: **Productivity**
   - "Does your extension access, collect or transmit personal information?" → **No**
     (così non serve una privacy policy)
   - Website: `https://www.gianlucadario.com` (facoltativo)
   - Support contact / email di supporto: `info@gianlucadario.com`
5. **Store listings** → aggiungi la lingua **Italiano** e incolla i testi qui sotto; carica `store/logo-300.png`
   come *Extension logo* e gli screenshot.
6. **Publish**. La revisione dura da qualche ora a pochi giorni; arriva una email con l'esito.

## 2. Firefox Add-ons — AMO (gratis)

1. Vai su <https://addons.mozilla.org/developers/> e accedi con un account Firefox (gratuito).
2. **Submit a New Add-on**:
   - "Where do you want to distribute it?": **On this site** (pubblica su addons.mozilla.org).
     In alternativa *On your own*: Mozilla la firma e ti dà un file `.xpi` da distribuire tu, senza scheda pubblica.
   - Carica `setup-pagina-nuova-scheda-firefox-1.0.0.zip`.
   - "Do you need to submit source code?": **No** (il codice non è minimizzato né generato).
3. Scheda dell'estensione: incolla i testi qui sotto. Categoria: **Tabs** (o *Other*).
   Licenza: **MIT** (o quella che preferisci). Privacy policy: non necessaria (nessun dato raccolto).
   Support email: `info@gianlucadario.com`. Homepage (facoltativa): `https://www.gianlucadario.com`.
4. **Submit Version**. La verifica automatica è immediata; quella manuale, se capita, richiede da ore a qualche giorno.

L'identificativo Firefox è `setup-pagina-nuova-scheda@gianlucadario.com` (in `tools/build.ps1`):
**non cambiarlo** dopo la prima pubblicazione, altrimenti Firefox la considera un'estensione diversa.

---

## Testi per gli store

**Nome**
Setup Pagina Nuova Scheda

**Descrizione breve** (max 132 caratteri per Edge / 250 per Firefox)
Apri il sito che vuoi a ogni nuova scheda: la tua dashboard, la tua pagina preferita, qualsiasi indirizzo.

**Descrizione completa**
Setup Pagina Nuova Scheda sostituisce la pagina "Nuova scheda" del browser con il sito che scegli tu.

Come funziona:
• alla prima nuova scheda ti chiede quale indirizzo aprire;
• da quel momento ogni nuova scheda (Ctrl+T o il pulsante +) apre direttamente quella pagina;
• puoi cambiare l'indirizzo quando vuoi dalle Opzioni dell'estensione.

Ideale per aprire subito la tua dashboard personale, il calendario, la posta, un motore di ricerca
o qualsiasi sito usi ogni giorno.

Privacy: l'estensione non raccoglie, non invia e non vende nessun dato. L'unica informazione salvata
è l'indirizzo che scegli, nelle impostazioni del browser (sincronizzato con il tuo account se la
sincronizzazione è attiva). Nessun tracciamento, nessuna pubblicità.

Permessi richiesti: "storage", solo per ricordare l'indirizzo che hai scelto.

**Note per i revisori** (campo "Notes to reviewers" / "Certification notes")
The extension overrides the New Tab page. On first use it shows a small form asking for a URL
(http/https only), saves it with storage.sync and from then on redirects new tabs to that URL with
location.replace(). Options page allows changing it. No remote code, no data collection, no network
requests other than loading the user-chosen page.

## Privacy policy (se uno store la chiedesse comunque)

Setup Pagina Nuova Scheda non raccoglie, non trasmette e non condivide alcun dato personale.
L'unico dato salvato è l'indirizzo web scelto dall'utente, memorizzato localmente nelle impostazioni
del browser (e sincronizzato dal browser stesso con l'account dell'utente, se la sincronizzazione è attiva).
L'estensione non effettua richieste di rete proprie e non contiene codice di tracciamento.
Contatto: info@gianlucadario.com
