-- Create users table (handled by Supabase Auth)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subtitles table
create table if not exists public.subtitles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  video_id text not null,
  video_title text,
  language text not null,
  content text not null,
  is_auto_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(video_id, user_id, language)
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.subtitles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own data" on public.users;
drop policy if exists "Users can view their own subtitles" on public.subtitles;
drop policy if exists "Users can insert their own subtitles" on public.subtitles;
drop policy if exists "Users can update their own subtitles" on public.subtitles;
drop policy if exists "Users can delete their own subtitles" on public.subtitles;

-- Create policies
create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can view their own subtitles"
  on public.subtitles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subtitles"
  on public.subtitles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subtitles"
  on public.subtitles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subtitles"
  on public.subtitles for delete
  using (auth.uid() = user_id);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.users to authenticated;
grant all on public.subtitles to authenticated;

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create indexes
create index if not exists subtitles_user_id_idx on public.subtitles(user_id);
create index if not exists subtitles_video_id_idx on public.subtitles(video_id);
create index if not exists subtitles_language_idx on public.subtitles(language); 