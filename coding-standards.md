# Coding Standards

Read this file before writing or refactoring code. These apply to all code in this project.

## Philosophy

Simple, readable, maintainable. Less code = less debt. Prefer clarity over cleverness.

## Rules

- **Early returns** over nested conditions.
- **Descriptive names** — prefix event handlers with `handle`.
- **Constants over functions** where possible.
- **DRY** — don't repeat yourself.
- **Functional style** — prefer immutable approaches when not verbose.
- **Minimal changes** — only modify code related to the task at hand.
- **Function ordering** — define composing functions before their components.
- **TODO comments** — mark issues with `TODO:` prefix.
- **Build iteratively** — minimal functionality first, verify, then add complexity.
- **Test frequently** — realistic inputs, validate outputs.
- **Clean logic** — core logic stays clean; push implementation details to the edges.
- **File organisation** — balance structure with simplicity for the project's current scale.

## React

- Functional components only — no class components.
- One component per file. Filename matches component name (`WheelEditor.tsx`).
- Hooks at the top of the component, before any logic.
- Extract custom hooks into `hooks/` when reused across 2+ components.
- Prefer controlled components for form inputs.
- Colocate component-specific types at the top of the same file. Shared types go in `types/`.
- Keep components small — if a component exceeds ~150 lines, split it.

## TypeScript

- Strict mode enabled (`"strict": true` in tsconfig).
- Use Supabase-generated types (`supabase gen types typescript`) — never hand-write database types.
- Prefer `interface` for object shapes, `type` for unions and intersections.
- No `any` — use `unknown` and narrow with type guards when type is uncertain.
- Explicit return types on exported functions. Inferred types are fine for internal/private functions.

## Tailwind CSS

- Utility classes only — no custom CSS files unless absolutely necessary.
- Use `cn()` helper (clsx + tailwind-merge) for conditional class composition.
- Design tokens via `tailwind.config.ts` (colors, spacing, fonts) — no hardcoded hex values in components.
- Mobile-responsive: use Tailwind breakpoints (`md:`, `lg:`), not media queries.

## Supabase

- Use `@supabase/supabase-js` client — never raw `fetch` to Supabase endpoints.
- Initialise the Supabase client in a single shared file (`lib/supabase.ts`).
- Row Level Security (RLS) is the primary authorization layer — every table must have RLS enabled with explicit policies.
- Never trust client-side filtering for security — RLS policies enforce access at the database level.
- Migrations in `supabase/migrations/` — never modify the database outside the migration workflow.
- Seed data in `supabase/seed.sql` for local development.
- Regenerate types after every schema change: `supabase gen types typescript --local > src/types/database.ts`.
