# AI Cost Rules

These rules are critical — follow them on every task that touches AI/parsing code.

- **schema.org first**: Always attempt to extract recipe data from schema.org structured data before calling the Claude API. Only fall back to AI if extraction fails or is incomplete.
- **Model**: Use `claude-haiku-4` for all parsing calls. Never use a more expensive model without explicit user approval.
- **Logging**: Every Claude API call must be logged through `/lib/ai-logger.ts` (caller, tokens, cost estimate, timestamp). Do not call the API without logging.
- **No AI in loops**: Never call the Claude API inside a loop over a collection. Batch requests where possible; if batching is not possible, discuss with the user before proceeding.
