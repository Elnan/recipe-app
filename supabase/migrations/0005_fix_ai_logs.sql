alter table ai_logs rename column caller to source_type;
alter table ai_logs rename column source_url to source_identifier;
alter table ai_logs add column recipe_id uuid references recipes(id)
  on delete set null;

-- Remove the broken RLS policy and disable RLS
drop policy if exists "service role only" on ai_logs;
alter table ai_logs disable row level security;

-- Add the correct indexes
create index idx_ai_logs_created_at on ai_logs (created_at desc);
create index idx_ai_logs_recipe_id on ai_logs (recipe_id);
