#!/usr/bin/env python3
"""Genera su stdout la versione riservata al collaudo nello schema isolato."""

from pathlib import Path
import sys

source = Path(__file__).with_name("index.html").read_text(encoding="utf-8")


def substitute(html, old, new, count=1):
    if html.count(old) != count:
        raise SystemExit(f"Configurazione inattesa per {old!r}. Nessuna pagina generata.")
    return html.replace(old, new)


source = substitute(
    source,
    "{auth:{storage:remember?localStorage:sessionStorage,",
    "{db:{schema:'fg_collaudo_haccp'},auth:{storage:remember?localStorage:sessionStorage,",
)
source = substitute(source, "'fg-haccp-auth'", "'fg-haccp-auth-collaudo'", 4)
source = substitute(source, "'fg-haccp-remember'", "'fg-haccp-remember-collaudo'", 2)
source = substitute(
    source,
    "const archivioFoto=()=>client.storage.from('haccp-foto-ricette');",
    "const archivioFoto=()=>({createSignedUrl:async()=>({error:true}),upload:async()=>({error:true})});",
)
source = substitute(
    source,
    "<title>GENCHI HACCP MANAGEMENT PROFESSIONAL</title>",
    "<title>GENCHI HACCP MANAGEMENT | COLLAUDO</title>",
)
source = substitute(
    source,
    "<style>",
    """<style>
body::before{content:"SOLO COLLAUDO · Usa dati fittizi";display:block;padding:12px;
background:#fff1c9;color:#482b00;text-align:center;font-weight:700}
""",
)
sys.stdout.buffer.write(source.encode("utf-8"))
