const basePdf = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/legacy/build/';

function elemento(tag, testo, classe) {
  const nodo = document.createElement(tag);
  if (testo) nodo.textContent = testo;
  if (classe) nodo.className = classe;
  return nodo;
}

function pulsante(testo, azione) {
  const bottone = elemento('button', testo);
  bottone.type = 'button';
  bottone.onclick = azione;
  return bottone;
}

const css = `
  .fg-lettore {
    position: fixed; inset: 0; width: 100%; height: 100%;
    height: 100dvh; max-width: none; max-height: none;
    padding: 0; margin: 0; border: 0; color: #172923; background: #e9efeb;
    box-sizing: border-box;
  }
  .fg-lettore[open] { display: flex; flex-direction: column; }
  .fg-lettore::backdrop { background: #e9efeb; }
  .fg-lettore .fg-lettore-barra {
    flex: none; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    justify-content: center; background: #fff; border-bottom: 1px solid #cbd4ce;
    padding: calc(8px + env(safe-area-inset-top, 0px)) 10px 8px;
  }
  .fg-lettore .fg-lettore-comandi {
    display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;
  }
  .fg-lettore button { min-height: 42px; }
  .fg-lettore button:disabled { opacity: .45; }
  .fg-lettore .fg-lettore-chiudi { font-weight: 700; }
  .fg-lettore .fg-lettore-corpo { flex: 1; min-height: 0; overflow: auto; text-align: center; }
  .fg-lettore .fg-lettore-pagina { position: relative; width: min(100%, 780px); margin: 0 auto; }
  .fg-lettore canvas { display: block; width: 100%; height: auto; }
  .fg-lettore button.fg-lettore-link {
    position: absolute; display: block; margin: 0; padding: 0; border: none;
    min-width: 0; min-height: 0; border-radius: 0; background: transparent; cursor: pointer;
  }
  .fg-lettore button.fg-lettore-link:focus-visible { outline: 3px solid #86520d; outline-offset: -2px; }
  .fg-lettore .fg-lettore-stato:empty { display: none; }
`;

async function indiceDestinazione(pdf, dest) {
  const destinazione = typeof dest === 'string' ? await pdf.getDestination(dest) : dest;
  if (!Array.isArray(destinazione) || destinazione[0] == null) return null;
  const riferimento = destinazione[0];
  return (Number.isInteger(riferimento) ? riferimento : await pdf.getPageIndex(riferimento)) + 1;
}

export function apriManuale(leggi, origine) {
  const lettore = elemento('dialog', '', 'fg-lettore');
  lettore.setAttribute('aria-label', 'Manuale illustrato');
  const barra = elemento('div', '', 'fg-lettore-barra');
  const corpo = elemento('div', '', 'fg-lettore-corpo');
  const stato = elemento('p', 'Caricamento del manuale…', 'fg-lettore-stato');
  stato.setAttribute('role', 'status');
  const paginaVisiva = elemento('div', '', 'fg-lettore-pagina');
  corpo.append(stato, paginaVisiva);
  const chiudi = pulsante('← Torna al gestionale', () => lettore.close());
  chiudi.className = 'fg-lettore-chiudi';
  const comandi = elemento('div', '', 'fg-lettore-comandi');
  const indice = pulsante('Indice', () => visualizza(1));
  const indietro = pulsante('‹', () => visualizza(numero - 1));
  indietro.setAttribute('aria-label', 'Pagina precedente');
  const avanti = pulsante('›', () => visualizza(numero + 1));
  avanti.setAttribute('aria-label', 'Pagina successiva');
  const contatore = elemento('span');
  contatore.setAttribute('aria-live', 'polite');
  comandi.append(indice, indietro, contatore, avanti);
  comandi.hidden = true;
  comandi.style.display = 'none';
  barra.append(chiudi, comandi);
  lettore.append(elemento('style', css), barra, corpo);
  document.body.append(lettore);

  let pdf, caricamentoPdf, renderInCorso;
  let numero = 1, revisione = 0;
  lettore.addEventListener('close', () => {
    revisione++;
    renderInCorso?.cancel();
    if (caricamentoPdf) void caricamentoPdf.destroy().catch(() => {});
    lettore.remove();
    if (origine?.isConnected) origine.focus();
  }, { once: true });
  lettore.showModal();
  chiudi.focus();

  async function visualizza(dest) {
    if (!pdf || !lettore.open || dest < 1 || dest > pdf.numPages) return;
    numero = dest;
    const id = ++revisione;
    renderInCorso?.cancel();
    stato.textContent = 'Caricamento pagina…';
    paginaVisiva.replaceChildren();
    contatore.textContent = `${numero} / ${pdf.numPages}`;
    indietro.disabled = numero === 1;
    avanti.disabled = numero === pdf.numPages;
    corpo.scrollTop = 0;
    try {
      const pagina = await pdf.getPage(dest);
      if (id !== revisione) return;
      const viewport = pagina.getViewport({ scale: 2 });
      const canvas = elemento('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute('aria-label', `Pagina ${dest} del manuale illustrato`);
      const task = pagina.render({ canvas, viewport });
      renderInCorso = task;
      const [, collegamenti] = await Promise.all([task.promise, pagina.getAnnotations()]);
      if (id !== revisione) return;
      const pulsanti = await Promise.all(collegamenti.filter(link => link.dest).map(async link => {
        const arrivo = await indiceDestinazione(pdf, link.dest);
        if (!arrivo) return null;
        const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(link.rect);
        const bottone = pulsante('', () => visualizza(arrivo));
        bottone.className = 'fg-lettore-link';
        bottone.setAttribute('aria-label', arrivo === 1 ? 'Torna all’indice del manuale' : `Vai alla pagina ${arrivo}`);
        Object.assign(bottone.style, {
          left: `${100 * Math.min(x1, x2) / viewport.width}%`,
          top: `${100 * Math.min(y1, y2) / viewport.height}%`,
          width: `${100 * Math.abs(x1 - x2) / viewport.width}%`,
          height: `${100 * Math.abs(y1 - y2) / viewport.height}%`,
        });
        return bottone;
      }));
      if (id !== revisione) return;
      paginaVisiva.replaceChildren(canvas, ...pulsanti.filter(Boolean));
      stato.textContent = '';
    } catch {
      if (id === revisione) stato.textContent = 'Pagina non disponibile. Scegli un’altra pagina o torna al gestionale.';
    }
  }

  async function carica() {
    try {
      const [url, pdfjs] = await Promise.all([leggi(), import(basePdf + 'pdf.min.mjs')]);
      if (!lettore.open) return;
      pdfjs.GlobalWorkerOptions.workerSrc = basePdf + 'pdf.worker.min.mjs';
      caricamentoPdf = pdfjs.getDocument({ url, isEvalSupported: false });
      pdf = await caricamentoPdf.promise;
      if (!lettore.open) return;
      comandi.hidden = false;
      comandi.style.display = '';
      await visualizza(1);
    } catch {
      if (lettore.open) stato.textContent = 'Impossibile caricare il manuale. Torna al gestionale e riprova.';
    }
  }
  void carica();
}
