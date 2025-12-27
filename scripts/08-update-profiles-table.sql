-- Script 08: Create/Update profiles table to support username and email-based login
-- This script is idempotent: safe to run multiple times

-- 1) Profiles table keyed by auth.user id
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	username text unique,
	email text not null,
	full_name text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- 2) Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 3) Auto-create profile on sign-up (from auth.users)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
	insert into public.profiles (id, email)
	values (new.id, new.email)
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) Sync profiles.email when the auth user's email changes
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer as $$
begin
	update public.profiles p
	   set email = new.email,
	       updated_at = now()
	 where p.id = new.id;
	return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.sync_profile_email();

-- 5) Enable RLS and define policies
alter table public.profiles enable row level security;

drop policy if exists "Profiles select self" on public.profiles;
create policy "Profiles select self" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "Profiles update self" on public.profiles;
create policy "Profiles update self" on public.profiles
for update using (auth.uid() = id);

drop policy if exists "Profiles insert self" on public.profiles;
create policy "Profiles insert self" on public.profiles
for insert with check (auth.uid() = id);

-- Optional helpful index for fast username lookups
create index if not exists profiles_username_idx on public.profiles using btree (username);

-- 6) Secure RPC to resolve username -> email for login (select-only, anon allowed)
create or replace function public.resolve_username_email(p_username text)
returns table(email text) language sql security definer as $$
  select p.email
  from public.profiles p
  where p.username = p_username
  limit 1
$$;

revoke all on function public.resolve_username_email(text) from public;
grant execute on function public.resolve_username_email(text) to anon;


