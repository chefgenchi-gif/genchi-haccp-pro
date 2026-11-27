const accessi = [
  ['Giacenze', 'Cerca prodotto, lotto o cella', 'Inventario FEFO'],
  ['Carico merce', 'Registra un lotto a mano', 'Ricevimento merci'],
  ['Scansiona DDT o fattura', 'Carica una foto o un XML', 'SMART SCAN'],
  ['Temperature', 'Registra la lettura di una cella', 'Temperature'],
  ['Ricette e foto', 'Apri le schede e allega una foto', 'Ricette e procedure'],
  ['Registro fatture e DDT', 'Consulta o inserisci un documento', 'Registro fatture'],
];

export function aggiungiAccessiRapidi(panel, apri) {
  const section = document.createElement('section');
  section.setAttribute('aria-label', 'Azioni rapide');
  const title = document.createElement('h2');
  title.textContent = 'Cosa devi fare?';
  const grid = document.createElement('div');
  grid.className = 'tiles';
  for (const [label, description, destination] of accessi) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    const heading = document.createElement('strong');
    heading.textContent = label;
    const hint = document.createElement('small');
    hint.textContent = description;
    hint.style.display = 'block';
    button.append(heading, hint);
    button.onclick = () => {
      apri(destination);
      const heading = panel.querySelector('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
      }
    };
    grid.append(button);
  }
  section.append(title, grid);
  panel.prepend(section);
}
