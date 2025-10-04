# Supabase Setup Instructions

## 1. Environment Variables

Create a `.env` file in the project root with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Database Schema

Run this SQL in your Supabase SQL editor:

```sql
create table if not exists documents(
  id text primary key,
  title text not null,
  content text not null default '',
  category text,
  file_type text,
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "read all" on documents for select using (true);
create policy "insert all" on documents for insert with check (true);
create policy "update all" on documents for update using (true);
```

## 3. Features

- **Autosave**: Documents automatically save 600ms after you stop typing
- **Fallback**: If Supabase env vars are missing, falls back to mock saves
- **Initial Load**: On app startup, loads existing documents from Supabase
- **Non-blocking**: Typing is never blocked, saves happen in background
- **Error Handling**: Network errors don't affect the editor experience

