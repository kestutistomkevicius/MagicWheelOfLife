# Dev Setup — Commands Reference

## Daily local development

```bash
supabase start        # start all Supabase services in Docker
npm run dev           # Vite dev server → http://localhost:5173
                      # Studio dashboard → http://localhost:54323
```

## Database

```bash
supabase db diff --schema public   # capture schema changes as migration file
supabase db reset                  # wipe local DB and re-run all migrations + seed
supabase status                    # show local URLs and API keys
supabase gen types typescript --local > src/types/database.ts  # regenerate types after schema change
```

## Testing & build

```bash
npm test              # frontend tests
npm run build         # verify production build works locally
```

## Stop local environment

```bash
supabase stop             # stop Docker containers (data preserved)
supabase stop --no-backup # stop and wipe all local data
```

## Deploy to production

```bash
git push origin master          # triggers Vercel auto-deploy (frontend)
supabase db push --linked       # push migrations to production Supabase
```

## First-time setup

```bash
supabase init    # create supabase/ config folder (once per project)
npm install      # install frontend dependencies
```

## Prerequisites

Docker Desktop, Node.js (≥20), Supabase CLI, npm.

## Migration workflow

1. Make schema changes via local Studio or write SQL directly
2. `supabase db diff --schema public` → creates file in `supabase/migrations/`
3. `supabase db reset` to verify locally
4. Commit migration file to git
5. `supabase db push --linked` to apply to production
