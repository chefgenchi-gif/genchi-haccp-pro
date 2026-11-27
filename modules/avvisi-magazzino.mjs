export function avviaAvvisiMagazzino(client, contenitore) {
  const pannello = document.createElement('section');
  pannello.setAttribute('aria-label', 'Avvisi magazzino');
  const titolo = document.createElement('h2');
  titolo.textContent = 'Avvisi magazzino';
  const stato = document.createElement('p');
  stato.setAttribute('role', 'status');
  stato.textContent = 'Caricamento avvisi…';
  const lista = document.createElement('ul');
  pannello.append(titolo, stato, lista);
  contenitore.prepend(pannello);

  let ultimo = null;
  let timer;
  let inCorso = false;
  let chiuso = false;

  async function aggiorna() {
    if (chiuso || inCorso || document.hidden) return;
    clearTimeout(timer);
    inCorso = true;
    try {
      const { data, error } = await client.rpc('haccp_leggi_avvisi_prelievo', { dopo: ultimo });
      if (chiuso) return;
      if (error || !Array.isArray(data)) throw Error('Avvisi non disponibili');
      for (const avviso of data) {
        const riga = document.createElement('li');
        riga.textContent = `${avviso.ubicazione} · ${avviso.prodotto} · Lotto ${avviso.lotto_id}: prelevati ${avviso.prelevato} ${avviso.unita}. Residuo ${avviso.residuo} ${avviso.unita}.`;
        lista.prepend(riga);
        ultimo = avviso.sequenza;
      }
      while (lista.children.length > 20) lista.lastElementChild.remove();
      stato.textContent = data.length ? lista.firstElementChild.textContent : (ultimo ? '' : 'Nessun avviso.');
      if (data.length === 100) {
        timer = setTimeout(aggiorna, 100);
        return;
      }
    } catch {
      if (!chiuso) stato.textContent = 'Aggiornamento avvisi in attesa di connessione.';
    } finally {
      inCorso = false;
    }
    if (!chiuso) timer = setTimeout(aggiorna, 8000 + Math.random() * 4000);
  }

  document.addEventListener('visibilitychange', aggiorna);
  window.addEventListener('online', aggiorna);
  void aggiorna();
  return () => {
    chiuso = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', aggiorna);
    window.removeEventListener('online', aggiorna);
    pannello.remove();
  };
}
