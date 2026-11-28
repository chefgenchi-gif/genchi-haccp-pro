# Verifica giacenza su Supabase

28 novembre 2026. Schema isolato `fg_collaudo_haccp`. Lotto fittizio da 5 kg.

- La sessione 276746 ha registrato 4 kg e completato la verifica alle 18:22:17.781 UTC.
- La sessione 276768 ha iniziato alle 18:22:18.628 UTC e ha respinto il prelievo di 3 kg per disponibilità insufficiente.
- Lo storico ha mostrato un solo avviso, con 4 kg prelevati e 1 kg residuo.

Le due transazioni osservate sono risultate sequenziali. Per dimostrare la concorrenza su Supabase serve un canale che consenta due connessioni contemporanee. Il salvataggio e la riapertura dei registri sull’iPad restano da verificare.
