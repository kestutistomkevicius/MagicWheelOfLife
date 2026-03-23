# Database Schema

```mermaid
erDiagram
    auth_users {
        uuid id PK
    }
    profiles {
        uuid id PK
        text tier "free|premium"
        text avatar_url "nullable"
        text color_scheme "default: amber"
        timestamptz created_at
    }
    wheels {
        uuid id PK
        uuid user_id FK
        text name
        timestamptz deleted_at "NULL = active; hard-deleted after 10min via pg_cron"
        timestamptz created_at
        timestamptz updated_at
    }
    categories {
        uuid id PK
        uuid wheel_id FK
        uuid user_id FK
        text name
        integer position
        integer score_asis "1-10"
        integer score_tobe "1-10"
        boolean is_important
        timestamptz created_at
        timestamptz updated_at
    }
    action_items {
        uuid id PK
        uuid category_id FK
        uuid user_id FK
        text text
        boolean is_complete
        date deadline "nullable"
        integer position
        timestamptz completed_at "nullable"
        varchar note "max 500"
        timestamptz created_at
        timestamptz updated_at
    }
    snapshots {
        uuid id PK
        uuid wheel_id FK
        uuid user_id FK
        text name
        timestamptz saved_at
    }
    snapshot_scores {
        uuid id PK
        uuid snapshot_id FK
        uuid user_id FK
        text category_name "TEXT COPY not FK — preserves history if category renamed/deleted"
        integer position
        integer score_asis "1-10"
        integer score_tobe "1-10"
    }
    feature_requests {
        uuid id PK
        uuid user_id FK "nullable ON DELETE SET NULL"
        text text "10-1000 chars"
        timestamptz created_at
    }
    ai_chat_messages {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        text role "user|assistant"
        text content
        timestamptz created_at "auto-deleted after 3 months via pg_cron"
    }

    auth_users ||--|| profiles : "1:1 auto-created via trigger"
    auth_users ||--o{ wheels : owns
    auth_users ||--o{ categories : owns
    auth_users ||--o{ action_items : owns
    auth_users ||--o{ snapshots : owns
    auth_users ||--o{ snapshot_scores : owns
    auth_users ||--o{ ai_chat_messages : owns
    wheels ||--o{ categories : contains
    wheels ||--o{ snapshots : has
    categories ||--o{ action_items : has
    categories ||--o{ ai_chat_messages : has
    snapshots ||--o{ snapshot_scores : captures
```

## RLS Summary

Every table has RLS enabled. Pattern: `user_id = auth.uid()` on SELECT/INSERT/UPDATE/DELETE.

- `snapshot_scores` — insert only; immutable once written (delete cascades from snapshot).
- `snapshots` — no UPDATE (name is immutable in v1).
- `feature_requests` — insert only for users; founder reads via service role.
- `wheels` — free-tier INSERT blocked by `count_user_wheels()` SECURITY DEFINER function (prevents RLS recursion).
- `storage.objects` (avatars bucket) — public read, authenticated write to own folder.
