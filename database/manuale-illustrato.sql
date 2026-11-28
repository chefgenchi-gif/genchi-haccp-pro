create table public.haccp_manuals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  pdf_base64 text not null check (
    left(pdf_base64, 7) = 'JVBERi0' and length(pdf_base64) <= 1400000
  ),
  primary key (owner_id, slug)
);

alter table public.haccp_manuals enable row level security;

revoke all on public.haccp_manuals from public, anon, authenticated;
grant select (slug, pdf_base64) on public.haccp_manuals to authenticated;

create policy haccp_manuals_read_own
on public.haccp_manuals for select to authenticated
using (owner_id = (select auth.uid()));
