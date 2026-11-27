# Collaudo giacenze — 27 novembre 2026

- Concorrenza: due sessioni PostgreSQL indipendenti, lotto isolato 9 kg, due richieste da 8 kg. Una accettata, una respinta, residuo 1 kg. Schema di prova eliminato.
- Atomicità: inserimento duplicato in tabella temporanea, nessuna riga parziale.
- Scadenza e conformità: aggiornamento condizionale su tabella temporanea, lotti non utilizzabili respinti.
- RLS: ruolo authenticated con identificativo estraneo, zero righe leggibili o modificabili.
- Archivio storico: 4 lotti, 49 kg ricevuti, 10 kg consumati, 39 kg contabili, zero saldi negativi.

Questi test non certificano l'integrazione applicativa. Prima del rilascio occorre implementare saldo transazionale per lotto, protezione delle rettifiche, conversione unità, trasferimenti e verifica delle procedure produttive. Nessun trigger operativo attivato.
