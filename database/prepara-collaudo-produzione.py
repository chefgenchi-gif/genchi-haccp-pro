#!/usr/bin/env python3
"""Stampa il collaudo SQL isolato, da inviare a psql o all'editor SQL."""
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
create temporary table haccp_archive (
  owner_id uuid not null, record_id text not null, module text not null,
  payload jsonb not null, revision bigint not null default 1,
  updated_at timestamptz not null default now(), primary key(owner_id, record_id)
);""")
for name in modules:
    sql = (root / (name + ".sql")).read_text(encoding="utf-8")
    sql = re.sub(r"^(begin;|commit;|create schema if not exists haccp_private;|grant usage on schema haccp_private to authenticated;)$", "", sql, flags=re.M)
    print(sql.replace("haccp_private.", "pg_temp.")
          .replace("public.haccp_", "pg_temp.haccp_")
          .replace("create table pg_temp.", "create temporary table pg_temp."))

fixture = (root / "test-flusso-produzione-avvisi.sql").read_text(encoding="utf-8")
print(re.sub(r"^begin;$", "", fixture, flags=re.M).replace("SCHEMA_TEST", "pg_temp"))
