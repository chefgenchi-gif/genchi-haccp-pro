import test from 'node:test';
import assert from 'node:assert/strict';
import {preparaEtichetta} from '../modules/etichetta-abbattimento.mjs';
const p={validata:true,versione:'TEST',riferimentoValidazione:'SIM',durataMassimaMin:90,temperaturaFinaleMassima:3,temperaturaInizialeMinima:65,durataConservazioneOre:24,temperaturaConservazioneMin:0,temperaturaConservazioneMax:3};
const c={operatore:'TEST',lotto:'SIM',lottiIngredienti:['SIM-1'],inizio:'2020-01-01T10:00:00Z',fine:'2020-01-01T11:00:00Z',temperaturaIniziale:80,temperaturaFinale:2,temperaturaConservazione:2,allergeniVerificati:true,prodotto:'TEST',reparto:'TEST',metodo:'Abbattimento positivo',unita:'kg',quantita:2,allergeni:'Pesce'};
test('bozza tracciabile',()=>{const r=preparaEtichetta(p,c);assert.equal(r.ok,true);assert.equal(r.bozza,true);assert.equal(r.etichetta.scadenza,'2020-01-02T11:00:00.000Z');assert.deepEqual(r.etichetta.lottiIngredienti,['SIM-1'])});
for(const [nome,pp,cc] of [['non validata',{validata:false},{}],['temperatura',{}, {temperaturaFinale:9}],['allergeni assenti',{}, {allergeni:''}],['quantita nulla',{}, {quantita:0}],['prodotto assente',{}, {prodotto:''}],['lotto assente',{}, {lotto:''}]])test(nome,()=>{const r=preparaEtichetta({...p,...pp},{...c,...cc});assert.equal(r.ok,false);assert.equal(r.etichetta,undefined)});
