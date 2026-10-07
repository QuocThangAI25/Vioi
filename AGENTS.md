<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All app state lives in `src/store/AppStore.tsx` (React Context + localStorage); swap persistence there when adding a backend.
- Financial formulas live only in `src/lib/financialCalculations.ts`; components never compute money values inline.
- Amounts are stored in VND; other currencies are display conversions in `src/lib/currencyFormatter.ts`.
- All UI text comes from `src/lib/translations.ts` (vi/en) via `useApp().t`.
