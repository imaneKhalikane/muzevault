# MuzeVault

A full-stack AI prompt library built with Next.js 14, Tailwind CSS, and Supabase.

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run the following schema:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles (auto-created on signup via trigger)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  is_admin boolean default false
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- categories
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique
);

alter table categories enable row level security;

create policy "Anyone can view categories"
  on categories for select using (true);

create policy "Admins can manage categories"
  on categories for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- prompts
create table prompts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  category_id uuid references categories(id) on delete set null,
  tags text[] default '{}',
  image_url text,
  image_prompt text,
  motion_prompt text,
  created_at timestamp with time zone default now()
);

alter table prompts enable row level security;

create policy "Authenticated users can view prompts"
  on prompts for select using (auth.role() = 'authenticated');

create policy "Admins can manage prompts"
  on prompts for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Set Up Storage

1. In your Supabase dashboard, go to **Storage**.
2. Create a new bucket named **`prompt-images`**.
3. Set the bucket to **Public**.
4. Add the following storage policy to allow authenticated admins to upload:

```sql
-- Allow admins to upload
create policy "Admins can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'prompt-images' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Allow anyone to read
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'prompt-images');
```

### 3. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_STAN_STORE_URL=https://stan.store/your-store
```

Find your Supabase URL and anon key in **Project Settings → API**.

### 4. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

1. Push your project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) and import the repo.
3. Add the three environment variables in the Vercel dashboard.
4. Deploy.

### 6. Make Yourself an Admin

After signing up (or creating a user in Supabase Auth), run this SQL in the **SQL Editor**:

```sql
update profiles
set is_admin = true
where email = 'your@email.com';
```

You can now log in at `/login` and will be redirected to `/admin`.

---

## Project Structure

```
app/
├── page.tsx              # Landing page
├── login/page.tsx        # Login
├── library/page.tsx      # Member prompt library (protected)
└── admin/
    ├── layout.tsx        # Admin shell with sidebar
    ├── page.tsx          # Dashboard overview
    ├── prompts/          # Manage prompts (list, add, edit)
    └── categories/       # Manage categories

components/
├── library/              # Library UI (cards, modal, filters)
└── admin/                # Admin UI (sidebar, forms, uploader)

lib/
├── supabase/             # Supabase client & server helpers
└── types.ts              # Shared TypeScript types

middleware.ts             # Auth protection for /library and /admin
```

---

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** — Auth, PostgreSQL, Storage
- **Lucide React** — Icons
