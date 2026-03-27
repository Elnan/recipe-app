-- Migration: 0006_menus
-- Creates menus and menu_recipes tables, and adds protein_type to recipes.

create table menus (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  name             text not null,
  week_number      integer,
  year             integer,
  is_active        boolean not null default false,
  dominant_protein text check (dominant_protein in
                    ('kjott','kylling','fisk','vegetar'))
);

create table menu_recipes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  menu_id    uuid not null references menus(id) on delete cascade,
  recipe_id  uuid not null references recipes(id) on delete cascade,
  position   integer not null check (position between 1 and 4),
  unique(menu_id, position)
);

-- Trigger to keep updated_at current
create trigger menus_set_updated_at
  before update on menus
  for each row execute function set_updated_at();

-- Also add protein_type to recipes table
alter table recipes
  add column protein_type text
  check (protein_type in ('kjott','kylling','fisk','vegetar'));
