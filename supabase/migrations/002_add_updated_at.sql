-- Adds `updated_at` to the content tables so the admin can say when something was
-- last edited.
--
-- Why
-- ---
-- The dashboard opens on an overview, and "when did I last touch this" is the
-- question an overview is asked first. Nothing recorded it: `cms_pages`,
-- `cms_cases`, `cms_testimonials`, `cms_company_logos` and `cms_navigation` all
-- had no timestamp of any kind, so the admin could only count rows, never say
-- which of them had been worked on lately.
--
-- Stamping it from the browser instead would put the editor's clock in the
-- database and would need every save to diff against the loaded copy to work
-- out which row actually changed. A trigger is both shorter and honest: the
-- value is written by the database, on the row that changed, at the moment it
-- changed.
--
-- How to apply
-- ------------
-- Paste this whole file into the Supabase dashboard, SQL Editor, and run it.
--
-- The function body in part 2 is dollar-quoted. If the editor splits pasted
-- statements on semicolons it will mangle that one statement - the error looks
-- like a syntax error near "begin". Everything else in the file is a plain
-- statement and will run either way. If part 2 fails, create just that function
-- on its own in the SQL editor, then re-run the file: `create or replace` makes
-- the second pass a no-op.
--
-- psql alternative, which has no splitting to worry about:
--   psql "$DATABASE_URL" -f supabase/migrations/002_add_updated_at.sql
--
-- Safe to run more than once.

-- 1. The columns.
--
-- `default now()` is what stamps a newly created row, since an insert has
-- nothing to compare itself against. Existing rows are backfilled with the time
-- this migration runs: nothing recorded their real history, so any earlier value
-- would be invented.
alter table public.cms_pages         add column if not exists updated_at timestamptz not null default now();
alter table public.cms_cases          add column if not exists updated_at timestamptz not null default now();
alter table public.cms_testimonials   add column if not exists updated_at timestamptz not null default now();
alter table public.cms_company_logos  add column if not exists updated_at timestamptz not null default now();
alter table public.cms_navigation     add column if not exists updated_at timestamptz not null default now();

-- 2. One trigger function for all five tables.
--
-- The column name is spelled the same everywhere, so one function covers every
-- table. Before-update rather than before-insert-or-update, because the column
-- default already handles inserts and a before-insert trigger would overwrite a
-- value the caller set deliberately.
create or replace function public.cms_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. The triggers. Dropped first because create trigger has no or-replace.
drop trigger if exists cms_pages_touch_updated_at        on public.cms_pages;
drop trigger if exists cms_cases_touch_updated_at         on public.cms_cases;
drop trigger if exists cms_testimonials_touch_updated_at  on public.cms_testimonials;
drop trigger if exists cms_company_logos_touch_updated_at on public.cms_company_logos;
drop trigger if exists cms_navigation_touch_updated_at    on public.cms_navigation;

create trigger cms_pages_touch_updated_at
  before update on public.cms_pages
  for each row execute function public.cms_touch_updated_at();

create trigger cms_cases_touch_updated_at
  before update on public.cms_cases
  for each row execute function public.cms_touch_updated_at();

create trigger cms_testimonials_touch_updated_at
  before update on public.cms_testimonials
  for each row execute function public.cms_touch_updated_at();

create trigger cms_company_logos_touch_updated_at
  before update on public.cms_company_logos
  for each row execute function public.cms_touch_updated_at();

create trigger cms_navigation_touch_updated_at
  before update on public.cms_navigation
  for each row execute function public.cms_touch_updated_at();

-- 4. Indexes for "newest first" reads.
create index if not exists cms_pages_updated_at_idx        on public.cms_pages (updated_at desc);
create index if not exists cms_cases_updated_at_idx         on public.cms_cases (updated_at desc);
create index if not exists cms_testimonials_updated_at_idx  on public.cms_testimonials (updated_at desc);
create index if not exists cms_company_logos_updated_at_idx on public.cms_company_logos (updated_at desc);
create index if not exists cms_navigation_updated_at_idx    on public.cms_navigation (updated_at desc);
