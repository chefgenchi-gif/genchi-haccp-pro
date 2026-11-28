const refrigerato = 'Fresco/refrigerato';
const congelato = 'Congelato';
const ambiente = 'Secco/ambiente';

const cataloghi = {
  'Cella carni': [refrigerato, {
    Carni: [
      'Petto di pollo', 'Cosce di pollo', 'Pollo intero', 'Fesa di tacchino',
      'Filetto di manzo', 'Entrecôte di manzo', 'Macinato di manzo', 'Guancia di manzo',
      'Fesa di vitello', 'Ossobuco di vitello', 'Carré di agnello', 'Capocollo di maiale',
      'Lonza di maiale', 'Pancetta fresca', 'Salsiccia fresca',
    ],
  }],
  'Cella pesce': [refrigerato, {
    'Pesce e molluschi': ['Cozze', 'Vongole', 'Ostriche', 'Capasante', 'Polpo', 'Seppia',
      'Calamaro', 'Totano', 'Gambero rosso', 'Scampi', 'Mazzancolle', 'Astice'],
  }],
  'Cella formaggi e latticini': [refrigerato, {
    'Formaggi e latticini': [
      'Parmigiano Reggiano DOP 24 mesi', 'Parmigiano Reggiano DOP 30 mesi',
      'Parmigiano Reggiano DOP grattugiato', 'Grana Padano DOP in pezzo',
      'Grana Padano DOP grattugiato', 'Pecorino Romano DOP in pezzo',
      'Pecorino Romano DOP grattugiato', 'Gorgonzola dolce', 'Gorgonzola piccante',
      'Scamorza bianca', 'Scamorza affumicata', 'Provolone', 'Fontina',
      'Mozzarella', 'Burrata', 'Stracciatella', 'Caciocavallo', 'Philadelphia', 'Alpigiana',
      'Mascarpone', 'Ricotta vaccina', 'Ricotta di pecora', 'Yogurt bianco',
      'Panna fresca 35%', 'Panna Debic', 'Latte intero fresco', 'Burro', 'Burro chiarificato',
    ],
  }],
  'Cella salumi': [refrigerato, {
    Salumi: ['Prosciutto crudo', 'Prosciutto cotto', 'Mortadella', 'Bresaola', 'Speck',
      'Salame', 'Pancetta arrotolata', 'Coppa', 'Guanciale', 'Fesa di tacchino affettata'],
  }],
  'Cella ortofrutta': [refrigerato, {
    Ortofrutta: ['Patate', 'Pomodori', 'Cipolle', 'Aglio', 'Prezzemolo', 'Basilico',
      'Carote', 'Sedano', 'Zucchine', 'Melanzane', 'Peperoni', 'Insalata',
      'Finocchi', 'Carciofi', 'Limoni', 'Arance', 'Mele', 'Pere', 'Fragole', 'Erbe aromatiche'],
  }],
  'Cella prodotti cotti': [refrigerato, {
    Preparazioni: ['Verdure cotte', 'Patate cotte', 'Legumi cotti', 'Riso cotto',
      'Polpo cotto', 'Arrosto cotto', 'Brodo di verdure', 'Fondo bruno', 'Sugo di pomodoro'],
  }],
  'Cella semilavorati': [refrigerato, {
    Preparazioni: ['Pasta fresca', 'Pasta fresca ripiena', 'Gnocchi freschi', 'Sfoglia fresca',
      'Impasto per pizza', 'Ripieno di verdure', 'Panatura aromatica', 'Salsa pronta'],
  }],
  'Cella pasticceria': [refrigerato, {
    Pasticceria: ['Pasta frolla', 'Pasta sfoglia fresca', 'Crema pasticcera', 'Ganache',
      'Mousse', 'Coulis di frutta', 'Purea di frutta'],
    'Uova e ovoprodotti': ['Albume pastorizzato', 'Tuorlo pastorizzato', 'Uovo intero pastorizzato'],
  }],
  'Congelatore carne': [congelato, {
    Carni: ['Petto di pollo surgelato', 'Pollo intero surgelato', 'Tacchino surgelato',
      'Manzo congelato', 'Vitello congelato', 'Agnello congelato', 'Maiale congelato'],
  }],
  'Congelatore pesce': [congelato, {
    'Pesce e molluschi': ['Merluzzo surgelato', 'Filetti di orata surgelati',
      'Filetti di branzino surgelati', 'Polpo T5 surgelato', 'Seppie surgelate',
      'Calamari surgelati', 'Gamberi surgelati', 'Scampi surgelati',
      'Cozze surgelate', 'Vongole surgelate', 'Capasante surgelate'],
  }],
  'Congelatore preparazioni': [congelato, {
    Preparazioni: ['Pasta ripiena surgelata', 'Gnocchi surgelati', 'Pane surgelato',
      'Preparazioni cotte congelate', 'Brodo congelato', 'Salsa congelata'],
    Ortofrutta: ['Piselli surgelati', 'Spinaci surgelati', 'Verdure miste surgelate', 'Frutti di bosco surgelati'],
    Pasticceria: ['Croissant surgelati', 'Pasta sfoglia surgelata', 'Semifreddi', 'Gelato'],
  }],
  'Magazzino alimenti secchi': [ambiente, {
    'Alimenti secchi': ['Riso', 'Riso Carnaroli', 'Riso Arborio', 'Riso Roma', 'Pasta secca',
      'Farina 00', 'Farina 0', 'Semola rimacinata', 'Pangrattato', 'Panko',
      'Ceci secchi', 'Fagioli secchi', 'Lenticchie secche', 'Passata di pomodoro',
      'Pomodori pelati', 'Olio extravergine di oliva', 'Olio di semi', 'Aceto',
      'Sale fino', 'Sale grosso', 'Zucchero', 'Amido di mais', 'Cacao amaro'],
    'Spezie e aromi': ['Pepe nero', 'Paprika', 'Zafferano', 'Origano', 'Noce moscata', 'Cannella'],
    Pasticceria: ['Cioccolato fondente', 'Cioccolato bianco', 'Gelatina alimentare', 'Lievito per dolci'],
  }],
  'Magazzino bevande': [ambiente, {
    Bevande: ['Acqua naturale', 'Acqua frizzante', 'Succo di frutta', 'Bibite',
      'Birra', 'Vino bianco', 'Vino rosso', 'Prosecco', 'Distillati', 'Caffè'],
  }],
  'Magazzino non alimentare': [ambiente, {
    'Non alimentare': ['Vaschette per alimenti', 'Contenitori per alimenti', 'Sacchetti sottovuoto',
      'Pellicola alimentare', 'Carta forno', 'Etichette', 'Guanti monouso', 'Carta asciugamani',
      'Detergente', 'Disinfettante'],
  }],
};

// Per queste voci lo stato fisico si sceglie dalla confezione al carico.
const prodottiDaOrdini = {
  'Cella carni': {
    Carni: ['Carne macinata', 'Filetto di maialino', 'Salsiccia luganega'],
  },
  'Cella pesce': {
    'Pesce e molluschi': [
      'Branzino eviscerato calibro 250/400', 'Dentice eviscerato',
      'Filetti di branzino calibro 400/600', 'Filetti di cernia', 'Filetti di ombrina',
      'Filetti di orata calibro 400/600', 'Filetti di ricciola', 'Filetti di salmone',
      'Filone di pesce spada', 'Pesce spada affumicato', 'Salmone affumicato',
      'Tonno decongelato',
    ],
  },
  'Cella formaggi e latticini': {
    'Formaggi e latticini': [
      'Caprino', 'Feta greca', 'Formaggi misti', 'Grana in ottavi', 'Latte', 'Panna 38%',
    ],
  },
  'Cella salumi': {
    Salumi: ['Black Angus affumicato', 'Capocollo', 'Coppa di Parma',
      'Fesa di tacchino arrosto', 'Finocchiata di Montalcino', 'Salame contadino', 'Salame Felino', 'Spianata'],
  },
  'Cella ortofrutta': {
    Ortofrutta: ['Asparagi', 'Cavolo bianco', 'Cipolla a fette', 'Fave', 'Funghi champignon interi'],
  },
  'Cella prodotti cotti': {
    Preparazioni: ['Spalla CBT'],
  },
  'Cella semilavorati': {
    Preparazioni: ['Cous cous di verdure', 'Gnocchi di patate', 'Paglia e fieno',
      'Panciotti alla capasanta', 'Ravioli alla burrata'],
  },
  'Cella pasticceria': {
    Pasticceria: ['Lievito di birra', 'Tartellette'],
    'Uova e ovoprodotti': ['Uova'],
  },
  'Congelatore pesce': {
    'Pesce e molluschi': [
      'Anelli di calamari', 'Cozze a mezzo guscio grandi', 'Gamberi di fiume surgelati', 'Gamberi sgusciati',
      'Gamberi sgusciati calibro 31/40', 'Polpa di astice', 'Polpa di granceola',
      'Polpa di scampi', 'Seppie calibro 50/100',
    ],
  },
  'Congelatore preparazioni': {
    Preparazioni: ['Arancini', 'Cotolette artigianali', 'Crocchette', 'Frittelle di alghe',
      'Patate a fette con buccia', 'Patate duchessa', 'Patate stick'],
    Ortofrutta: ['Funghi misto bosco'],
    Pasticceria: ['Cornetti vuoti'],
  },
  'Magazzino alimenti secchi': {
    'Alimenti secchi': [
      'Arachidi', 'Crema di aceto al ribes', 'Crema di aceto allo zafferano', 'Crema di aceto alla menta',
      'Cuori di palma', 'Farro precotto', 'Fusilli senza glutine', 'Glassa al balsamico',
      'Ketchup in monoporzione', 'Ketchup in secchio', 'Maionese in monoporzione',
      'Maionese in secchio', 'Mais al naturale', 'Mandorle', 'Mezzi paccheri',
      'Mezzi paccheri rigati', 'Noci', 'Olive nere denocciolate', 'Orecchiette senza glutine',
      'Pane senza glutine', 'Penne', 'Penne senza glutine', 'Riso MARR',
      'Tonno sott’olio', 'Tubetti senza glutine', 'Zucchero semolato', 'Purè di patate (Phifanny)',
    ],
  },
  'Magazzino bevande': {
    Bevande: ['Vino Porto'],
  },
};

export function catalogoUbicazione(ubicazione, storico, specie) {
  const [stato, gruppi] = Object.hasOwn(cataloghi, ubicazione) ? cataloghi[ubicazione] : [];
  const catalogo = new Map();
  for (const [categoria, prodotti] of Object.entries(gruppi ?? {})) {
    const elenco = ubicazione === 'Cella pesce' && categoria === 'Pesce e molluschi'
      ? [...specie, ...prodotti] : prodotti;
    for (const nome of elenco) catalogo.set(nome.toLocaleLowerCase('it'), { nome, categoria, stato });
  }
  const importati = Object.hasOwn(prodottiDaOrdini, ubicazione) ? prodottiDaOrdini[ubicazione] : {};
  for (const [categoria, prodotti] of Object.entries(importati)) {
    for (const nome of prodotti) {
      const chiave = nome.toLocaleLowerCase('it');
      if (!catalogo.has(chiave)) catalogo.set(chiave, { nome, categoria, stato: '' });
    }
  }
  for (const prodotto of storico) {
    if (prodotto.ubicazione === ubicazione && typeof prodotto.nome === 'string' && prodotto.nome.trim()) {
      catalogo.set(prodotto.nome.toLocaleLowerCase('it'), prodotto);
    }
  }
  return [...catalogo.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

export function mostraCatalogoMagazzino(panel, prodotti) {
  const details = document.createElement('details');
  details.className = 'record';
  const titolo = document.createElement('summary');
  titolo.textContent = 'Catalogo prodotti';
  const guida = document.createElement('p');
  guida.className = 'muted';
  guida.textContent = prodotti.length
    ? 'Per registrare una consegna, apri Carico merce e scegli il prodotto.'
    : 'I prodotti registrati in questa ubicazione compariranno qui.';
  details.append(titolo, guida);
  if (prodotti.length) {
    const lista = document.createElement('ul');
    lista.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px 20px;padding-inline-start:1.25rem';
    for (const prodotto of prodotti) {
      const voce = document.createElement('li');
      voce.textContent = prodotto.nome;
      lista.append(voce);
    }
    details.append(lista);
  }
  panel.append(details);
}

export function aggiungiCatalogoCarico(form, storico, specie) {
  const { Prodotto: nome, Categoria: categoria, Ubicazione: ubicazione,
    'Stato fisico': stato } = form.elements;
  const label = document.createElement('label');
  label.textContent = 'Prodotto da catalogo';
  const selezione = document.createElement('select');
  label.append(selezione);
  const info = document.createElement('small');
  info.className = 'muted';
  info.setAttribute('aria-live', 'polite');
  label.append(info);
  nome.closest('label').before(ubicazione.closest('label'), label);

  let prodotti = [];
  function aggiorna() {
    prodotti = catalogoUbicazione(ubicazione.value, storico, specie);
    selezione.replaceChildren(new Option(ubicazione.value ? 'Seleziona un prodotto' : 'Scegli prima l’ubicazione', ''));
    for (const prodotto of prodotti) selezione.add(new Option(prodotto.nome, prodotto.nome));
    selezione.disabled = !prodotti.length;
    selezione.value = prodotti.some(prodotto => prodotto.nome === nome.value) ? nome.value : '';
    info.textContent = !ubicazione.value ? 'Scegli l’ubicazione per aprire il catalogo della cella.'
      : 'Se il prodotto manca, scrivilo nel campo Prodotto.';
  }
  selezione.onchange = () => {
    const prodotto = prodotti.find(voce => voce.nome === selezione.value);
    if (!prodotto) return;
    nome.value = prodotto.nome;
    if ([...categoria.options].some(opzione => opzione.value === prodotto.categoria)) categoria.value = prodotto.categoria;
    if ([...stato.options].some(opzione => opzione.value === prodotto.stato)) stato.value = prodotto.stato;
  };
  for (const campo of [ubicazione, categoria, stato, nome]) campo.addEventListener('change', aggiorna);
  aggiorna();
}
