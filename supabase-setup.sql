create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  section text not null default 'art' check (section in ('art', 'wips')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  title text not null,
  description text not null default '',
  date_label text not null default '',
  sort_order integer not null default 0,
  made_in jsonb not null default '[]'::jsonb,
  thumbnail jsonb,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_projects_set_updated_at on public.portfolio_projects;

create trigger portfolio_projects_set_updated_at
before update on public.portfolio_projects
for each row
execute function public.set_updated_at();

alter table public.app_admins enable row level security;
alter table public.portfolio_projects enable row level security;

drop policy if exists "Admins can read admin table" on public.app_admins;
create policy "Admins can read admin table"
on public.app_admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can view published art projects" on public.portfolio_projects;
create policy "Public can view published art projects"
on public.portfolio_projects
for select
to public
using (status = 'published' and section = 'art');

drop policy if exists "Admins can manage projects" on public.portfolio_projects;
create policy "Admins can manage projects"
on public.portfolio_projects
for all
to authenticated
using (
  exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view portfolio media" on storage.objects;
create policy "Public can view portfolio media"
on storage.objects
for select
to public
using (bucket_id = 'portfolio-media');

drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'portfolio-media'
  and exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (
    select 1
    from public.app_admins admins
    where admins.user_id = auth.uid()
  )
);
