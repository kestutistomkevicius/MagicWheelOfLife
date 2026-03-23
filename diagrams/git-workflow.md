# Git Workflow

```mermaid
gitGraph
   commit id: "master"
   branch phase/XX-name
   checkout phase/XX-name
   commit id: "plan commit"
   commit id: "plan commit"
   checkout master
   merge phase/XX-name id: "merge --no-ff"
```

## Rules

- One branch per phase: `git checkout -b phase/XX-phase-name`
- All work stays on phase branch until phase is fully complete and verified.
- Merge to master with `--no-ff`: `git merge --no-ff phase/XX-phase-name`
- Merging master triggers Vercel auto-deploy (frontend).
- Push DB migrations separately after merge: `supabase db push --linked`
- Delete phase branch after merge: `git branch -d phase/XX-phase-name`
- **Never push plan commits directly to master.**

## Branch naming

Match `.planning/phases/` directory names:
`phase/01-foundation`, `phase/02-wheel-scoring`, `phase/07-action-items-and-wheel-polish`, etc.
