// GENCHI HACCP - motore preliminare di verifica, non sostituisce validazione
export function verificaCiclo(p,c){
 const errori=[];
 const numero=x=>typeof x==='number'&&Number.isFinite(x);
 if(!p||p.validata!==true||!p.versione||!p.riferimentoValidazione) return {conforme:false,errori:['Procedura non validata']};
 if(!c||!c.operatore||!c.lotto||!Array.isArray(c.lottiIngredienti)||!c.lottiIngredienti.length||c.lottiIngredienti.some(x=>typeof x!=='string'||!x.trim())) return {conforme:false,errori:['Tracciabilità incompleta']};
 const inizio=Date.parse(c.inizio),fine=Date.parse(c.fine);
 if(!Number.isFinite(inizio)||!Number.isFinite(fine)||fine<=inizio||fine>Date.now()) errori.push('Orari non validi');
 if(!numero(p.durataMassimaMin)||p.durataMassimaMin<=0||!numero(p.temperaturaFinaleMassima)||!numero(p.temperaturaInizialeMinima)) errori.push('Limiti non definiti');
 if(!numero(c.temperaturaIniziale)||!numero(c.temperaturaFinale)||c.temperaturaIniziale<p.temperaturaInizialeMinima||c.temperaturaFinale>p.temperaturaFinaleMassima) errori.push('Temperature non conformi');
 if((fine-inizio)/60000>p.durataMassimaMin) errori.push('Durata eccessiva');
 if(c.allergeniVerificati!==true) errori.push('Allergeni non verificati');
 if(!numero(p.durataConservazioneOre)||p.durataConservazioneOre<=0||!numero(p.temperaturaConservazioneMin)||!numero(p.temperaturaConservazioneMax)||p.temperaturaConservazioneMin>p.temperaturaConservazioneMax) errori.push('Conservazione non definita');
 if(!numero(c.temperaturaConservazione)||c.temperaturaConservazione<p.temperaturaConservazioneMin||c.temperaturaConservazione>p.temperaturaConservazioneMax) errori.push('Temperatura conservazione non conforme');
 return {conforme:errori.length===0,errori,scadenza:errori.length?null:new Date(fine+p.durataConservazioneOre*3600000).toISOString()};
}
