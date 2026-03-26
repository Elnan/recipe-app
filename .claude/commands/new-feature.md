# New Feature

Before writing any code for a new feature:

1. Read `/types/recipe.ts` — confirm whether the feature requires changes to the canonical Recipe type. If it does, stop and discuss with the user before proceeding.
2. Read the relevant section of `CLAUDE.md` (AI cost rules, DB conventions, UI conventions).
3. Check `node_modules/next/dist/docs/` for any Next.js APIs you plan to use.
4. If the feature touches the database, all queries must go through `/lib/supabase.ts`.
5. If the feature calls Claude API, check `/lib/ai-logger.ts` is wired up and use `claude-haiku-4` model.

Then implement the feature following the project conventions.
