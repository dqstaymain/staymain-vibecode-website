-- Adds the `position` column the admin uses to persist manual ordering.
--
-- Why
-- ---
-- The nav, cases, testimonials and logos are stored one row per item and
-- reloaded with `.order('position')`. Without the column that query fails and
-- the loader quietly falls back to `.order('id')`, and ids are generated as
-- `nav-<timestamp>-<random>`. A reorder then looks like it worked, saves with a
-- 200, and comes back in the original order on reload.
--
-- How to apply
-- ------------
-- Paste this whole file into the Supabase dashboard, SQL Editor, and run it.
-- It is deliberately flat: no DO blocks and no dollar quoting, because the web
-- editor splits pasted statements on semicolons and mangles a dollar-quoted
-- body. Every statement below is standalone and safe to run on its own.
--
-- Safe to run more than once.
--
-- psql alternative:
--   psql "$DATABASE_URL" -f supabase/migrations/001_add_position_columns.sql

-- 1. The columns.
alter table public.cms_navigation    add column if not exists position integer;
alter table public.cms_cases         add column if not exists position integer;
alter table public.cms_testimonials  add column if not exists position integer;
alter table public.cms_company_logos add column if not exists position integer;

-- 2. Backfill, so the first load keeps the order rows are already in rather
--    than collapsing everything to NULL and dropping back to id order.
--    Ordered by id on purpose: that is exactly the order the fallback shows
--    today, so applying this changes nothing you can see.
with ordered as (
  select id, row_number() over (order by id) - 1 as rn
  from public.cms_navigation
)
update public.cms_navigation as n
set position = ordered.rn
from ordered
where n.id = ordered.id;

with ordered as (
  select id, row_number() over (order by id) - 1 as rn
  from public.cms_cases
)
update public.cms_cases as c
set position = ordered.rn
from ordered
where c.id = ordered.id;

with ordered as (
  select id, row_number() over (order by id) - 1 as rn
  from public.cms_testimonials
)
update public.cms_testimonials as t
set position = ordered.rn
from ordered
where t.id = ordered.id;

with ordered as (
  select id, row_number() over (order by id) - 1 as rn
  from public.cms_company_logos
)
update public.cms_company_logos as l
set position = ordered.rn
from ordered
where l.id = ordered.id;

-- 3. Indexes for the ordering query.
create index if not exists cms_navigation_position_idx    on public.cms_navigation (position);
create index if not exists cms_cases_position_idx         on public.cms_cases (position);
create index if not exists cms_testimonials_position_idx  on public.cms_testimonials (position);
create index if not exists cms_company_logos_position_idx on public.cms_company_logos (position);
