import {verificaCiclo} from './verifica-abbattimento.mjs';
export function preparaEtichetta(p,c){
 const esito=verificaCiclo(p,c);
 if(!esito.conforme)return {ok:false,errori:esito.errori};
 const testo=x=>typeof x==='string'&&x.trim().length>0;
 if(![c.prodotto,c.reparto,c.metodo,c.unita,c.allergeni,p.versione].every(testo)||!Number.isFinite(c.quantita)||c.quantita<=0)return {ok:false,errori:['Dati etichetta incompleti']};
 return {ok:true,bozza:true,etichetta:{prodotto:c.prodotto,lotto:c.lotto,lottiIngredienti:[...c.lottiIngredienti],reparto:c.reparto,metodo:c.metodo,quantita:c.quantita,unita:c.unita,allergeni:c.allergeni,operatore:c.operatore,inizio:c.inizio,fine:c.fine,scadenza:esito.scadenza,temperaturaMin:p.temperaturaConservazioneMin,temperaturaMax:p.temperaturaConservazioneMax,versioneProcedura:p.versione,riferimentoValidazione:p.riferimentoValidazione}};
}
