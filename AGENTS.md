<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Monthly and weekly budgets share `budgetStatus` in `src/lib/expenses/calc.ts`; add new budget periods there, not in components — keeps warning thresholds identical everywhere.
- Every page gets the weekly limit from `weeklyBudgetStatus` in `src/lib/expenses/calc.ts` (fixed amount or wallet money received); never compute it in components — dashboard, weekly, wallet and budget pages must agree.
- The week start lives only in `WEEK_STARTS_ON` in `src/lib/expenses/calc.ts`; every calculation uses it — dashboard, weekly page and budgets must agree on "this week".
- Theme (light/dark/system) is applied by a pre-paint inline script in `__root.tsx` plus `src/lib/theme.ts`; keep the storage key in sync between them — avoids a light flash on load.
- Load the Netlify Vite plugin in `vite.config.ts` only behind the `NETLIFY` env check via dynamic import; importing it eagerly crashes the Lovable dev server.
- The visual style (borders, shadows, palette) comes from the `--outline`/`--elev-*`/colour tokens in `src/styles.css` and the Card/Button base classes; restyle there, not per page — keeps every page consistent.
