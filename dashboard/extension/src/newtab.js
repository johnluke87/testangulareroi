// La nuova scheda: se hai già scelto la pagina ci va subito, altrimenti mostra il modulo per sceglierla.
(async () => {
  const url = await loadPageUrl();
  if (url) {
    // replace e non "location.href = ...": così il tasto Indietro non riporta a questa pagina vuota
    location.replace(url);
    return;
  }

  // primo utilizzo: mostro il modulo; dopo il salvataggio vado subito alla pagina scelta
  document.body.classList.add('setup');
  document.getElementById('url').focus();
  await setupForm((saved) => location.replace(saved));
})();
