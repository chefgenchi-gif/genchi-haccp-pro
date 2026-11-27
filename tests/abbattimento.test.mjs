import test from 'node:test';
import assert from 'node:assert/strict';
import {verificaCiclo} from '../modules/verifica-abbattimento.mjs';
// Parametri sintetici esclusivamente per test software, non prescrizioni HACCP.
const p={validata:true,versione:'TEST',riferimentoValidazione:'TEST FITTIZIO',durataMassimaMin:90,temperaturaFinaleMassima:3,temperaturaInizialeMinima:65,durataConservazioneOre:24,temperaturaConservazioneMin:0,temperaturaConservazioneMax:3};
const c={operatore:'TEST',lotto:'SIM',lottiIngredienti:['SIM-1'],inizio:'2020-01-01T10:00:00Z',fine:'2020-01-01T11:00:00Z',temperaturaIniziale:80,temperaturaFinale:2,temperaturaConservazione:2,allergeniVerificati:true};
test('ciclo sintetico valido',()=>assert.equal(verificaCiclo(p,c).conforme,true));
for(const [nome,pp,cc] of [
 ['procedura non validata',{validata:false},{}],
 ['lotto mancante',{}, {lotto:''}],
 ['ingredienti senza lotto',{}, {lottiIngredienti:[]}],
 ['temperatura finale eccessiva',{}, {temperaturaFinale:9}],
 ['durata eccessiva',{}, {fine:'2020-01-01T12:00:00Z'}],
 ['allergeni non verificati',{}, {allergeniVerificati:false}],
 ['conservazione non definita',{durataConservazioneOre:null},{}],
 ['temperatura cella non conforme',{}, {temperaturaConservazione:9}],
 ['orari invertiti',{}, {fine:'2020-01-01T09:00:00Z'}]
]) test(nome,()=>{const r=verificaCiclo({...p,...pp},{...c,...cc});assert.equal(r.conforme,false);assert.equal(r.scadenza??null,null)});
