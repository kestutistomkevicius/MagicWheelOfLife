# decisions_history.md — Historical / Rejected Options

Not loaded into context. Kept for reference only.

---

## DEC-001 (rejected option): .NET Full-Stack

Evaluated alongside Supabase-centered stack. Rejected in favour of DEC-001 (see `decisions.md`).

| Layer | Choice |
|---|---|
| Backend | .NET 10, ASP.NET Web API, C# |
| Frontend | React + TypeScript + Tailwind |
| Database | PostgreSQL (self-managed via Docker) |
| ORM | Entity Framework Core + Npgsql |
| Auth | Auth0 (free tier) |
| Local dev | Docker Compose (API + PostgreSQL) |
| Hosting | Railway or Render |
| CI/CD | GitHub Actions |

**Pros**: Owner knows .NET. Full control over business logic. Traditional, well-understood architecture.
**Cons**: Must write dozens of API endpoints, auth flows, migration scripts. Slower path to MVP. More infrastructure to manage as a solo founder.
