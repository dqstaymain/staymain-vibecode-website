-- Adds the `position` column the admin uses to persist manual ordering.
--
-- Why this is needed
-- -------------------
-- The nav, cases, testimonials and logos are stored as one row per item and
-- reloaded with `.order('position')`. Without the column the query fails and the
-- loader silently falls back to `.order('id')`, and ids are generated as
-- `nav-<timestamp>-<random>`. The result is that a reorder looks like it worked,
-- saves with a 200, and then comes back in the original order on reload.
--
-- Safe to run more than once.
--
-- Apply in the Supabase dashboard under SQL Editor, or with:
--   psql "$DATABASE_URL" -f supabase/migrations/001_add_position_columns.sql

alter table public.cms_navigation     add column if not exists position integer;
alter table public.cms_cases          add column if not exists position integer;
alter table public.cms_testimonials   add column if not exists position integer;
alter table public.cms_company_logos  add column if not exists position integer;

-- Backfill so the first load keeps whatever order the rows are already in,
-- rather than collapsing everything to NULL and falling back to id order.
do $$
declare
  t text;
begin
  foreach t in array array[
    'cms_navigation', 'cms_cases', 'cms_testimonials', 'cms_company_logos'
  ] loop
    execute format(
      'with ordered as (
         select id, row_number() over (order by id) - 1 as rn from public.%I
       )
       update public.%I set position = ordered.rn from ordered where %I.id = ordered.id',
      t, t, t
    );
  end loop;
end $$;

create index if not exists cms_navigation_position_idx    on public.cms_navigation (position);
create index if not exists cms_cases_position_idx         on public.cms_cases (position);
create index if not exists cms_testimonials_position_idx  on public.cms_testimonials (position);
create index if not exists cms_company_logos_position_idx on public.cms_company_logos (position);
