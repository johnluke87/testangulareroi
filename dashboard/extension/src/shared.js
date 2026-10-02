// Codice comune a newtab.html e options.html.
// Firefox espone le API come "browser", Edge/Chrome come "chrome": uso quella che c'è.
const ext = globalThis.browser ?? globalThis.chrome;

// storage.sync: l'indirizzo segue il tuo account del browser (lo ritrovi su tutti i tuoi PC)
const STORAGE_KEY = 'pageUrl';

/**
 * Trasforma quello che scrive l'utente in un indirizzo valido, oppure null.
 * "gianlucadario.com/extra/dashboard" -> "https://gianlucadario.com/extra/dashboard"
 * Accetto solo http e https: niente "javascript:", "file:" o altri tipi strani.
 */
function normalizeUrl(text) {
  let value = (text ?? '').trim();
  if (value === '') {
    return null;
  }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = 'https://' + value;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

async function loadPageUrl() {
  const saved = await ext.storage.sync.get(STORAGE_KEY);
  return normalizeUrl(saved[STORAGE_KEY]);
}

async function savePageUrl(url) {
  await ext.storage.sync.set({ [STORAGE_KEY]: url });
}

/**
 * Collega il modulo (uguale nelle due pagine): legge l'indirizzo salvato, controlla e salva.
 * onSaved viene chiamata dopo un salvataggio riuscito.
 */
async function setupForm(onSaved) {
  const form = document.getElementById('form');
  const input = document.getElementById('url');
  const message = document.getElementById('message');

  input.value = (await loadPageUrl()) ?? '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // niente ricaricamento della pagina
    const url = normalizeUrl(input.value);
    if (url === null) {
      message.textContent = 'Indirizzo non valido: scrivi qualcosa come https://www.esempio.it';
      message.className = 'message error';
      input.focus();
      return;
    }
    await savePageUrl(url);
    input.value = url;
    message.textContent = 'Salvato ✓ Le prossime nuove schede apriranno questa pagina.';
    message.className = 'message ok';
    onSaved?.(url);
  });
}
