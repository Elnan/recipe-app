-- Migration: 0002_recipe_updates
-- Adds cooking_method and dietary columns to recipes table.

alter table recipes
  add column cooking_method text,
  add column dietary        text[] not null default '{}';
