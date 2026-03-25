# Git Workflow

## Repository

`https://github.com/kestutistomkevicius/MagicWheelOfLife.git`

## Branch Model

```
develop  →  master
(staging)   (production)
```

- `master` — production. Merging here triggers Vercel production deploy.
- `develop` — active development and staging. All phase work committed here directly.

> **Note:** Phase branches (`phase/XX-name`) were the original plan but all phases (1–11) have been committed directly to `develop`. Keeping phase branches is deferred until team size or PR review needs arise.

## Phase Workflow (repeat per phase)

1. Ensure you're on develop: `git checkout develop && git pull origin develop`
2. Do all work on `develop` (GSD executor commits atomically per task)
3. Push: `git push origin develop`

## Releasing to Production

When `develop` is stable and ready to ship:

1. Open PR: `develop → master`
2. This is the deliberate "ship to users" gate — review before merging
3. Merge with `--no-ff` → triggers Vercel production deploy
4. Push DB migrations: `supabase db push --linked`

## Rules

- NEVER push directly to master
- NEVER merge develop → master unless staging is verified
