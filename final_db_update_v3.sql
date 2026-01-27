create table if not exists content_reports (
  id uuid default uuid_generate_v4() primary key,
  content_id text not null,
  content_url text,
  reason text,
  status text default 'pending', -- pending, resolved, dismissed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table content_reports enable row level security;
create policy "Anon can insert reports" on content_reports for insert with check (true);
create policy "Admin can view reports" on content_reports for select using (true); 
create policy "Admin can update reports" on content_reports for update using (true);
