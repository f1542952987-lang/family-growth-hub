-- Family Hub V17 cloud schema (matches deployed Supabase project)
-- Browser code uses only a publishable key. Family authorization is enforced with RLS.
create extension if not exists pgcrypto;

create table if not exists public.family_members (
  family_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('dad','mom','bro','me')),
  created_at timestamptz not null default now(),
  primary key (family_id,user_id),
  unique (family_id,role)
);
create index if not exists family_members_user_id_idx on public.family_members(user_id);

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

create table if not exists public.family_role_invites (
  family_id text not null,
  role text not null check (role in ('dad','mom','bro','me')),
  code_hash text not null,
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  primary key (family_id,role)
);

alter table public.family_members enable row level security;
alter table public.family_progress enable row level security;
alter table public.family_posts enable row level security;
alter table public.family_role_invites enable row level security;

-- A signed-in user can only read their own membership row.
create policy "member can read own membership" on public.family_members
for select to authenticated
using ((select auth.uid()) = user_id);

-- Any member of the same family can read family progress; only the user whose role matches may write that role's progress.
create policy "family members can read progress" on public.family_progress
for select to authenticated
using (exists (select 1 from public.family_members m where m.family_id = family_progress.family_id and m.user_id = (select auth.uid())));
create policy "family members can insert progress" on public.family_progress
for insert to authenticated
with check (exists (select 1 from public.family_members m where m.family_id = family_progress.family_id and m.user_id = (select auth.uid()) and m.role = family_progress.role));
create policy "family members can update own progress" on public.family_progress
for update to authenticated
using (exists (select 1 from public.family_members m where m.family_id = family_progress.family_id and m.user_id = (select auth.uid()) and m.role = family_progress.role))
with check (exists (select 1 from public.family_members m where m.family_id = family_progress.family_id and m.user_id = (select auth.uid()) and m.role = family_progress.role));

create policy "family members can read posts" on public.family_posts
for select to authenticated
using (exists (select 1 from public.family_members m where m.family_id = family_posts.family_id and m.user_id = (select auth.uid())));
create policy "family members can insert own posts" on public.family_posts
for insert to authenticated
with check (exists (select 1 from public.family_members m where m.family_id = family_posts.family_id and m.user_id = (select auth.uid()) and m.role = family_posts.role));
create policy "family members can update own posts" on public.family_posts
for update to authenticated
using (exists (select 1 from public.family_members m where m.family_id = family_posts.family_id and m.user_id = (select auth.uid()) and m.role = family_posts.role))
with check (exists (select 1 from public.family_members m where m.family_id = family_posts.family_id and m.user_id = (select auth.uid()) and m.role = family_posts.role));
create policy "family members can delete own posts" on public.family_posts
for delete to authenticated
using (exists (select 1 from public.family_members m where m.family_id = family_posts.family_id and m.user_id = (select auth.uid()) and m.role = family_posts.role));

grant select on public.family_members to authenticated;
grant select,insert,update on public.family_progress to authenticated;
grant select,insert,update,delete on public.family_posts to authenticated;
revoke all on public.family_role_invites from anon, authenticated;

-- Family role invite hashes are server-only and are checked by the claim-family-role Edge Function.

-- Private family media bucket. Never switch this bucket to public.
insert into storage.buckets (id,name,public)
values ('family-media','family-media',false)
on conflict (id) do update set public=false;

create policy "family media read" on storage.objects
for select to authenticated
using (bucket_id='family-media' and exists (
  select 1 from public.family_members m
  where m.family_id = split_part(name,'/',1)
    and m.user_id = (select auth.uid())
));
create policy "family media upload own role" on storage.objects
for insert to authenticated
with check (bucket_id='family-media' and exists (
  select 1 from public.family_members m
  where m.family_id = split_part(name,'/',1)
    and m.user_id = (select auth.uid())
));
create policy "family media delete" on storage.objects
for delete to authenticated
using (bucket_id='family-media' and exists (
  select 1 from public.family_members m
  where m.family_id = split_part(name,'/',1)
    and m.user_id = (select auth.uid())
));
