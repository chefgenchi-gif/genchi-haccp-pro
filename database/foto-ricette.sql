begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('haccp-foto-ricette','haccp-foto-ricette',false,5242880,array['image/jpeg','image/png','image/webp']);

create policy haccp_foto_ricette_lettura on storage.objects
for select to authenticated using (
  bucket_id='haccp-foto-ricette'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists (
    select 1 from public.haccp_archive a
    where a.owner_id=(select auth.uid()) and a.module='Ricette e procedure'
      and a.record_id=split_part(name,'/',2)
      and storage.objects.name=a.owner_id::text||'/'||a.record_id||'/foto'
  )
);

create policy haccp_foto_ricette_carica on storage.objects
for insert to authenticated with check (
  bucket_id='haccp-foto-ricette'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists (
    select 1 from public.haccp_archive a
    where a.owner_id=(select auth.uid()) and a.module='Ricette e procedure'
      and a.record_id=split_part(name,'/',2)
      and storage.objects.name=a.owner_id::text||'/'||a.record_id||'/foto'
  )
);

create policy haccp_foto_ricette_sostituisci on storage.objects
for update to authenticated using (
  bucket_id='haccp-foto-ricette'
  and split_part(name,'/',1)=(select auth.uid())::text
) with check (
  bucket_id='haccp-foto-ricette'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists (
    select 1 from public.haccp_archive a
    where a.owner_id=(select auth.uid()) and a.module='Ricette e procedure'
      and a.record_id=split_part(name,'/',2)
      and storage.objects.name=a.owner_id::text||'/'||a.record_id||'/foto'
  )
);
commit;
