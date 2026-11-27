import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8').split('\n');
const code = prefix => {
  const line = source.find(line => line.startsWith(prefix));
  assert.ok(line, 'Funzione del gestionale mancante: ' + prefix);
  return line;
};

function setup() {
  const reports = [];
  const select = { value: '', onchange: null };
  const button = { textContent: 'Registra produzione', disabled: false };
  const form = {
    elements: { recipe: select, 'Scadenza validata': { value: '' } },
    querySelectorAll: () => [button],
    onsubmit() { assert.fail('Invio di produzione non previsto nel collaudo'); },
  };
  const porzioni = { value: 20 };
  const info = {};
  const elements = { prod: form, prodPort: porzioni, recipeInfo: info, panel: { prepend() {} } };
  const context = createContext({
    db: [], active: 'Produzione', dept: '', render() {},
    $: id => elements[id],
    alert: message => reports.push(message),
    document: {
      createElement: () => ({ style: {}, append(child) { if (child.textContent) reports.push(child.textContent); }, scrollIntoView() {} }),
    },
  });
  const prefixes = [
    'const units=', 'const departments=', 'function validUnit(', 'function receiptUnit(',
    'function receiptQty(', 'function factor(', 'function stock(', 'function expired(v){return v?.length',
    'function recipeLines(', 'function scaled(', 'function fgRecipeIssues(', 'const fgVisibleRender=',
    'render=function(){fgVisibleRender()', '(()=>{const previous=render;render=function(){previous();if(active',
    'function simulate(){const f=',
  ];
  runInContext(`const today=()=> '2026-11-27'; const esc=s=>String(s);\n` + prefixes.map(code).join('\n'), context);
  return { context, reports, select, button, form };
}

const recipe = (id, name, category, ingredients, procedure, allergens) => ({
  id,
  module: 'Ricette e procedure',
  data: {
    Preparazione: name,
    Reparto: 'Cucina calda',
    'Categoria produzione': category,
    'Porzioni base': 10,
    'Ingredienti e grammature': ingredients,
    Lavorazione: procedure,
    Allergeni: allergens,
    'Procedura validata': 'Non validata - solo collaudo',
  },
});

const polpo = recipe('RIC-POLPO', 'Polpo scottato con crema di patate', 'Secondi',
  'Polpo; 1000; g\nPatate; 800; g',
  'Cuocere e porzionare il polpo, scottare i tentacoli e servire sulla crema di patate.',
  'Molluschi');
const risotto = recipe('RIC-RISO', 'Risotto alle patate', 'Risotti',
  'Riso; 750; g\nPatate; 400; g',
  'Tostare il riso, portare a cottura aggiungendo acqua calda e incorporare le patate cotte.',
  'Verificare le schede degli ingredienti effettivi');

const lot = (id, product, quantity, unit, expiry, outcome = 'Conforme') => ({
  id,
  module: 'Ricevimento merci',
  data: { Prodotto: product, Quantità: quantity, Unità: unit, Scadenza: expiry, Esito: outcome, 'Lotto fornitore': id },
});

function seed(context) {
  context.db.push(polpo, risotto,
    lot('POLPO-SCADUTO', 'Polpo', 10, 'kg', '2000-01-01'),
    lot('POLPO-NC', 'Polpo', 10, 'kg', '2099-01-01', 'Non conforme'),
    lot('POLPO-B', 'Polpo', 4, 'kg', '2099-03-01'),
    lot('POLPO-A', 'Polpo', 1, 'kg', '2099-02-01'),
    lot('PATATE', 'Patate', 10, 'kg', '2099-03-01'),
    lot('RISO', 'Riso', 100, 'g', '2099-03-01'));
}

test('ricette da 1 a 1000 porzioni e limite del calcolatore', () => {
  const { context } = setup();
  seed(context);
  const amounts = n => runInContext(`scaled(db[0], ${n}).map(x=>x.q).join(',')`, context);
  assert.equal(amounts(1), '100,80');
  assert.equal(amounts(1000), '100000,80000');
  for (const n of [0, 1.5, 1001]) assert.throws(() => amounts(n), /Porzioni da 1 a 1000/);
});

test('simulazione polpo: FEFO, conversione g/kg, lotti inadatti esclusi', () => {
  const { context, reports, select } = setup();
  seed(context);
  select.value = polpo.id;
  runInContext('render()', context);
  // Il pulsante della simulazione viene aggiunto dal render applicativo.
  const children = [];
  context.$('panel').prepend = element => children.push(element);
  runInContext('render()', context);
  children[0].onclick();
  const report = reports.join('\n');
  assert.match(report, /POLPO-A.*prelievo 1\.000 kg.*residuo simulato 0\.000 kg/);
  assert.match(report, /POLPO-B.*prelievo 1\.000 kg.*residuo simulato 3\.000 kg/);
  assert.match(report, /PATATE.*prelievo 1\.600 kg/);
  assert.doesNotMatch(report, /POLPO-SCADUTO|POLPO-NC/);
  assert.ok(report.indexOf('POLPO-A') < report.indexOf('POLPO-B'));
  assert.ok(!context.db.some(row => row.module === 'Produzione'));
});

test('simulazione risotto: giacenza insufficiente e procedura da validare', () => {
  const { context, reports, select, button, form } = setup();
  seed(context);
  const children = [];
  context.$('panel').prepend = element => children.push(element);
  runInContext('render()', context);
  select.value = risotto.id;
  select.onchange({});
  assert.equal(button.disabled, true);
  form.onsubmit({ preventDefault() {} });
  assert.match(reports[0], /procedura non validata/);
  children[0].onclick();
  assert.match(reports.join('\n'), /Riso: 1400\.000000 g mancanti/);
  assert.match(reports.join('\n'), /Nessun prodotto finito simulato/);
  assert.ok(!context.db.some(row => row.module === 'Produzione'));
});
