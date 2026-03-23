# Local Dev Environment

```mermaid
graph LR
    Browser["Browser :5173"] --> Vite["Vite dev server\nnpm run dev"]
    Vite --> React["React + TypeScript\nTailwind CSS"]
    React -->|"Supabase JS client"| Supa["Supabase CLI (Docker) :54321"]
    Supa --> PG["PostgreSQL :54322"]
    Supa --> GoTrue["GoTrue Auth"]
    Supa --> REST["PostgREST API"]
    Supa --> Storage["Storage (avatars)"]
    Supa --> Studio["Studio UI :54323"]
    React -->|"Edge Function call"| Edge["Supabase Edge Function\n(AI Coach proxy)"]
    Edge --> Anthropic["Anthropic API"]
```

## Ports

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Supabase API | http://localhost:54321 |
| PostgreSQL | localhost:54322 |
| Studio | http://localhost:54323 |
