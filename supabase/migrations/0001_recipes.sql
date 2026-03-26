-- Migration: 0001_recipes
-- Creates the recipes table matching /types/recipe.ts exactly.
-- Note: RLS intentionally omitted — add policies in a later migration.

create table recipes (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  source_url       text,
  image_url        text,

  servings         integer not null,
  prep_time_minutes integer,
  cook_time_minutes integer,

  category         text not null check (category in ('dinner', 'breakfast', 'baking', 'dessert', 'other')),
  rating           smallint check (rating between 1 and 5),

  cuisine          text,
  tags             text[],

  ingredients      jsonb not null default '[]',
  steps            jsonb not null default '[]',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Trigger to keep updated_at current on every row update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_set_updated_at
  before update on recipes
  for each row
  execute function set_updated_at();
