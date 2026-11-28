#!/usr/bin/env python3
"""Genera lo schema privato Supabase destinato ai soli dati fittizi."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
modules = [
    "controllo-prelievi-archivio",
    "controllo-procedura-produzione",
    "registrazione-produzione",
    "avvisi-prelievo-magazzino",
    "lettura-avvisi-magazzino",
    "protezione-storico-prelievi"
]
print("""begin;
create schema fg_collaudo_haccp;
revoke all on schema fg_collaudo_haccp from public, anon, authenticated;
grant usage on schema fg_collaudo_haccp to authenticated;
create table fg_collaudo_haccp.haccp_archive (
  owner_id uuid not null, record_id text not null, module text not null,
  payload jsonb not null, revision bigint not null default 1,
  updated_at timestamptz not null default now(), primary key (owner_id, record_id)
);
alter table fg_collaudo_haccp.haccp_archive enable row level security;
grant select, insert, update on fg_collaudo_haccp.haccp_archive to authenticated;
create policy archivio_proprio on fg_collaudo_haccp.haccp_archive
  for all to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
""")
for name in modules:
    sql = (root / (name + ".sql")).read_text(encoding="utf-8")
    sql = re.sub(r"^(begin;|commit;|create schema if not exists haccp_private;|grant usage on schema haccp_private to authenticated;)$", "", sql, flags=re.M)
    print(sql.replace("haccp_private.", "fg_collaudo_haccp.")
          .replace("public.haccp_", "fg_collaudo_haccp.haccp_"))
print("commit;")
