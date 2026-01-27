-- 1. Reset Policies (Fixes the "Already Exists" error)
drop policy if exists "Anon can insert reports" on content_reports;
drop policy if exists "Service role full access" on content_reports;

-- 2. Create Table (Safe if already exists)
create table if not exists content_reports (
  id uuid default uuid_generate_v4() primary key,
  content_id text not null,
  content_url text,
  reason text,
  status text default 'pending', -- pending, resolved, dismissed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Security
alter table content_reports enable row level security;

-- 4. Re-Apply Policies (Clean Slate)
create policy "Anon can insert reports" on content_reports for insert with check (true);
create policy "Service role full access" on content_reports for all using (auth.role() = 'service_role');
