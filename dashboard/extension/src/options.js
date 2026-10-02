// Le opzioni dell'estensione: cambia l'indirizzo e, se vuoi, aprilo subito per provarlo.
setupForm();

document.getElementById('try').addEventListener('click', async () => {
  const url = await loadPageUrl();
  if (url) {
    window.open(url, '_blank', 'noopener');
  }
});
