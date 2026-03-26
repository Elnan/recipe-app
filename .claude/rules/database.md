# Database Rules

- **Single client**: All database access goes through the exported `supabase` client in `/lib/supabase.ts`. Never call `createClient` inline in a component or API route.
- **All queries in `/lib/supabase.ts`**: Write named query functions there; import and call them elsewhere. No inline `.from()` chains outside that file.
- **Row Level Security**: Every Supabase table must have RLS enabled. Do not create or suggest tables without RLS policies.
- **Ingredient amounts**: Store as `decimal` / `numeric` in the database. Units are a separate `text` column — never combine them into a single string like `"2 cups"`.
- **Servings scaling**: Scaling is pure client-side arithmetic. Never write a DB query, stored procedure, or API route that performs servings scaling.
