create table shopping_list_items (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null,
  amount           numeric,
  unit             text,
  store_section    text not null default 'other',
  notes            text,
  source_recipe_id uuid references recipes(id) on delete set null,
  source_menu_id   uuid references menus(id) on delete set null,
  is_manual        boolean not null default false
);

create index on shopping_list_items (store_section);
