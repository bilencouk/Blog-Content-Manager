-- Blog Content Manager Schema

create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  type text not null check (type in ('wordpress', 'custom')),
  wp_api_url text,
  wp_api_key text, -- base64 encoded "username:application_password"
  custom_api_url text,
  created_at timestamptz default now()
);

create table if not exists post_ideas (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references blogs(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references blogs(id) on delete cascade,
  idea_id uuid references post_ideas(id) on delete set null,
  title text not null,
  excerpt text,
  body text,
  cover_image_url text,
  keywords text[],
  category text,
  category_id integer,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_url text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists post_ideas_blog_id_idx on post_ideas(blog_id);
create index if not exists posts_blog_id_idx on posts(blog_id);
create index if not exists posts_idea_id_idx on posts(idea_id);
