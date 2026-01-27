-- Run this in Supabase SQL Editor to enable Reports

create table if not exists content_reports (
  id uuid default uuid_generate_v4() primary key,
  content_id text not null,
  content_url text,
  reason text,
  status text default 'pending', -- pending, resolved, dismissed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security
alter table content_reports enable row level security;

-- Allow anyone to insert reports (Anonymous reporting)
create policy "Anon can insert reports" on content_reports for insert with check (true);

-- Allow Admins (Service Role) to view everything
create policy "Service role full access" on content_reports for all using (auth.role() = 'service_role');
