create table ingredient_products (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  ingredient_name    text not null unique,
  norwegian_name     text,
  kassal_product_id  integer,
  kassal_name        text,
  package_size_g     numeric,
  package_size_ml    numeric,
  package_size_count integer,
  unit_type          text not null default 'unknown'
    check (unit_type in ('weight','volume','piece','unknown')),
  manually_verified  boolean not null default false,
  lookup_attempted   boolean not null default false
);

create index on ingredient_products (ingredient_name);
