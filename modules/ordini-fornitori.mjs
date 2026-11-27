export function testoOrdine(ordine) {
  const d = ordine.data;
  return [
    'Ordine ' + ordine.id,
    'Fornitore: ' + d.Fornitore,
    'Consegna richiesta: ' + d.Consegna,
    '',
    d['Prodotti e quantità'],
    d.Note ? '\nNote: ' + d.Note : '',
  ].join('\n').trim();
}

export function collegamentiOrdine(ordine) {
  const d = ordine.data;
  const subject = encodeURIComponent('Ordine ' + ordine.id);
  const body = encodeURIComponent(testoOrdine(ordine));
  const email = String(d.Email || '').trim();
  const numero = String(d.WhatsApp || '').trim().replace(/^[+]|[\s().-]/g, '');
  const destinatario = /^[^\s@?&#;]+@[^\s@?&#;]+$/.test(email) ? encodeURIComponent(email) : '';
  return {
    mail: 'mailto:' + destinatario + '?subject=' + subject + '&body=' + body,
    whatsapp: 'https://wa.me/' + (/^[1-9]\d{6,14}$/.test(numero) ? numero : '') + '?text=' + body,
  };
}

export function mostraOrdini({ panel, archive, records, salva }) {
  const fornitori = records.filter(r => r.module === 'Anagrafica fornitori');
  panel.innerHTML = `<h2>Ordini fornitori</h2><form>
    <label>Fornitore<select name="fornitore" required><option value="">Seleziona fornitore</option></select></label>
    <label>Consegna richiesta<input name="consegna" type="date" required></label>
    <label>Prodotti e quantità<textarea name="prodotti" required placeholder="Merluzzo surgelato — 50 kg"></textarea></label>
    <label>Note<textarea name="note"></textarea></label>
    <button>Salva ordine</button>
    <p role="status"></p>
  </form>`;
  const f = panel.querySelector('form');
  for (const r of fornitori) f.elements.fornitore.add(new Option(r.data.Fornitore, r.id));
  const b = f.querySelector('button');
  const stato = f.querySelector('[role="status"]');
  let bozza;
  f.onsubmit = async e => {
    e.preventDefault();
    if (b.disabled) return;
    const fornitore = fornitori.find(r => r.id === f.elements.fornitore.value);
    const prodotti = f.elements.prodotti.value.trim();
    if (!fornitore || !prodotti) { stato.textContent = 'Indica il fornitore e i prodotti.'; return; }
    const data = {
      Fornitore: fornitore.data.Fornitore, 'Fornitore ID': fornitore.id,
      Email: fornitore.data.Email || '', WhatsApp: fornitore.data.WhatsApp || '',
      Consegna: f.elements.consegna.value, 'Prodotti e quantità': prodotti, Note: f.elements.note.value.trim(),
    };
    if (!bozza || JSON.stringify(data) !== JSON.stringify(bozza.data)) {
      bozza = { id: 'FG-O-' + crypto.randomUUID(), module: 'Ordini fornitori', at: new Date().toISOString(), data };
    }
    b.disabled = true;
    stato.textContent = 'Salvataggio online…';
    try {
      await salva(bozza);
    } catch (error) {
      stato.textContent = error.message;
    } finally {
      b.disabled = false;
    }
  };

  archive.replaceChildren();
  const h = document.createElement('h2'); h.textContent = 'Ordini salvati'; archive.append(h);
  for (const r of records.filter(x => x.module === 'Ordini fornitori').sort((a,b) => b.at.localeCompare(a.at))) {
    const card = document.createElement('article'); card.className = 'record';
    const riepilogo = document.createElement('pre');
    riepilogo.style.whiteSpace = 'pre-wrap';
    riepilogo.textContent = testoOrdine(r);
    card.append(riepilogo);
    const links = collegamentiOrdine(r);
    for (const [label, href] of [['Apri email', links.mail], ['Apri WhatsApp', links.whatsapp]]) {
      const a = document.createElement('a'); a.textContent = label; a.href = href;
      a.style.marginRight = '1rem';
      if (label === 'Apri WhatsApp') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      card.append(a);
    }
    const feedback = document.createElement('p'); feedback.setAttribute('role', 'status');
    const condividi = document.createElement('button'); condividi.type = 'button';
    condividi.textContent = navigator.share ? 'Condividi ordine' : 'Copia ordine';
    condividi.onclick = async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'Ordine ' + r.id, text: testoOrdine(r) });
        else { await navigator.clipboard.writeText(testoOrdine(r)); feedback.textContent = 'Ordine copiato.'; }
      } catch (error) {
        if (error.name !== 'AbortError') feedback.textContent = 'Condivisione non disponibile.';
      }
    };
    card.append(condividi, feedback);
    archive.append(card);
  }
}
