-- Family Hub V17 cloud schema
-- Run inside Supabase after Auth is enabled.
create extension if not exists pgcrypto;

create table if not exists public.family_members (
  family_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('dad','mom','bro','me')),
  created_at timestamptz not null default now(),
  primary key (family_id,user_id),
  unique (family_id,role)
);

create table if not exists public.family_progress (
  family_id text not null,
  role text not null check (role in ('dad','mom','bro','me')),
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (family_id,role)
);

create table if not exists public.family_posts (
  id uuid primary key default gen_random_uuid(),
  family_id text not null,
  role text not null check (role in ('dad','mom','bro','me')),
  text text not null default '',
  media_url text,
  media_type text,
  created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;
alter table public.family_progress enable row level security;
alter table public.family_posts enable row level security;

create or replace function public.is_family_member(fid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.family_members m
    where m.family_id=fid and m.user_id=auth.uid()
  );
$$;

create policy "members read membership" on public.family_members
for select using (public.is_family_member(family_id));

create policy "members read progress" on public.family_progress
for select using (public.is_family_member(family_id));
create policy "members write progress" on public.family_progress
for all using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "members read posts" on public.family_posts
for select using (public.is_family_member(family_id));
create policy "members create posts" on public.family_posts
for insert with check (public.is_family_member(family_id));
create policy "members update own role posts" on public.family_posts
for update using (
  public.is_family_member(family_id) and exists(
    select 1 from public.family_members m
    where m.family_id=family_posts.family_id and m.user_id=auth.uid() and m.role=family_posts.role
  )
);
create policy "members delete own role posts" on public.family_posts
for delete using (
  public.is_family_member(family_id) and exists(
    select 1 from public.family_members m
    where m.family_id=family_posts.family_id and m.user_id=auth.uid() and m.role=family_posts.role
  )
);

-- Storage bucket should be private. Do not use a public bucket for family media.
insert into storage.buckets (id,name,public)
values ('family-media','family-media',false)
on conflict (id) do update set public=false;

create policy "family media read" on storage.objects
for select to authenticated
using (
  bucket_id='family-media' and public.is_family_member(split_part(name,'/',1))
);
create policy "family media upload" on storage.objects
for insert to authenticated
with check (
  bucket_id='family-media' and public.is_family_member(split_part(name,'/',1))
);
create policy "family media delete" on storage.objects
for delete to authenticated
using (
  bucket_id='family-media' and public.is_family_member(split_part(name,'/',1))
);
