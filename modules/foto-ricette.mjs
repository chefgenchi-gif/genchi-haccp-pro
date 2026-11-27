const tipi = ['image/jpeg', 'image/png', 'image/webp'];
const massimo = 5 * 1024 * 1024;

export function aggiungiFotoRicetta(archivio, ricetta, servizio) {
  const scheda = document.createElement('details');
  scheda.className = 'record';
  const titolo = document.createElement('summary');
  titolo.textContent = 'Foto · ' + (ricetta.data.Preparazione || ricetta.id);
  const img = document.createElement('img');
  img.alt = 'Foto di ' + (ricetta.data.Preparazione || 'questa ricetta');
  img.style.cssText = 'max-width:100%;max-height:28rem;object-fit:contain;';
  img.hidden = true;
  const label = document.createElement('label');
  label.textContent = 'Allega o sostituisci foto';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = tipi.join(',');
  label.append(input);
  const stato = document.createElement('p');
  stato.setAttribute('role', 'status');
  scheda.append(titolo, img, label, stato);
  archivio.append(scheda);

  async function mostraFoto() {
    const { data, error } = await servizio.leggi(ricetta.id);
    if (error || !data?.signedUrl) {
      img.hidden = true;
      return false;
    }
    img.src = data.signedUrl;
    img.hidden = false;
    return true;
  }

  scheda.ontoggle = async () => {
    if (!scheda.open || input.disabled) return;
    stato.textContent = 'Verifica foto online…';
    try {
      stato.textContent = await mostraFoto() ? '' : 'Foto non disponibile.';
    } catch {
      stato.textContent = 'Impossibile leggere la foto online.';
    }
  };

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    if (!tipi.includes(file.type) || file.size === 0 || file.size > massimo) {
      stato.textContent = 'Scegli una foto JPG, PNG o WebP fino a 5 MB.';
      input.value = '';
      return;
    }
    input.disabled = true;
    stato.textContent = 'Salvataggio foto online…';
    try {
      const { error } = await servizio.salva(ricetta.id, file);
      if (error) throw error;
      stato.textContent = await mostraFoto() ? 'Foto salvata online.' : 'Foto salvata online. Riapri la scheda per visualizzarla.';
    } catch {
      stato.textContent = 'Foto non salvata. Riprova.';
    } finally {
      input.disabled = false;
      input.value = '';
    }
  };
}
