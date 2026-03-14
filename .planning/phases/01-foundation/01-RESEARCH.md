# Phase 1: Foundation - Research

**Researched:** 2026-03-14
**Domain:** Vite + React + TypeScript scaffold, Supabase Auth (email/password + Google OAuth), React Router v7, shadcn/ui, Tailwind CSS warm palette, Supabase seed data
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Shell Layout**
- Left sidebar navigation
- Sidebar items: My Wheel, Snapshots, Trend, Settings — all wired to real routes with placeholder pages from day 1 (not disabled, not grayed — just placeholder content)
- Authenticated placeholder content: blank shell + "Coming soon" text on non-wheel routes
- Color/branding direction: warm/earthy palette (not neutral gray, not dark theme)
- Layout: sidebar on left, content area on right — standard SaaS dashboard shape

**Routing**
- Unauthenticated visitors hitting any route -> redirect to `/auth`
- After successful login -> redirect to `/wheel`
- All 4 nav routes scaffolded: `/wheel`, `/snapshots`, `/trend`, `/settings`

**Auth UX**
- Single `/auth` page with a toggle between "Sign in" and "Create account" modes
- OAuth buttons: Google only (Apple omitted entirely)
- Auth errors: inline form errors (below field or below submit button), not toasts or banners

**Apple OAuth**
- Deferred to Phase 7 (production launch)
- Apple sign-in button NOT included in Phase 1 UI — omit entirely, add back in Phase 7
- Phase 1 supports: email/password + Google OAuth only

**Seed Users**
- Free-tier user: `free@test.com` / `test123` — 8 default categories, mid-range scores (4-7), mix of action items
- Premium-tier user: `premium@test.com` / `test123` — 8 categories, 4+ snapshots, mixed trajectory (some categories up, some down across snapshots)

### Claude's Discretion
- Exact warm/earthy color values (Tailwind palette choices within the warm/earthy direction)
- Specific sidebar width, typography, spacing
- Loading skeleton / spinner during auth session resolution
- Exact placeholder copy for non-wheel routes
- Specific score values for seed data (as long as they tell the mixed-trajectory story)
- Settings page placeholder content

### Deferred Ideas (OUT OF SCOPE)
- Apple OAuth (AUTH-03) — deferred to Phase 7 (production launch). No Apple Developer account; Apple rejects localhost callbacks anyway.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can register with email and password | Supabase `signUp()` + email confirmation disabled locally |
| AUTH-02 | User can sign in with Google (OAuth) | Supabase `signInWithOAuth({ provider: 'google' })` + config.toml + Google Cloud Console credentials |
| AUTH-03 | User can sign in with Apple (OAuth) | DEFERRED to Phase 7 per CONTEXT.md — do NOT implement in Phase 1 |
| AUTH-04 | User session persists across browser refresh | `onAuthStateChange` + `getSession()` in React context; Supabase stores session in localStorage automatically |
| AUTH-05 | User can log out from any page | `supabase.auth.signOut()` accessible via auth context; redirects to `/auth` |
| DEV-01 | Local seed: free-tier user with 1 wheel, scored categories, some action items | `supabase/seed.sql` INSERT into `auth.users` + `auth.identities` using bcrypt hashing |
| DEV-02 | Local seed: premium-tier user with 4+ snapshots, meaningfully different scores | Same seed.sql pattern, plus application-level data in public schema tables |
| DEV-03 | Seeded action items: mix of completed, with deadlines, open | Seed data values — covered by application schema in Phases 2-3 but user record needed now |
| DEV-04 | Seeded snapshots telling a visible story (e.g., Health improved, Career declined) | Seed data values — snapshot schema in Phase 4 but user identity needed now |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield project scaffold. There is no existing code — every file must be created. The work divides into three parallel tracks: (1) Vite + React + TypeScript + Tailwind + shadcn/ui project scaffold, (2) Supabase Auth integration with email/password and Google OAuth, and (3) local seed data for the two dev users.

The stack is fully locked: React 18 + TypeScript + Tailwind CSS + Vite 5, Supabase JS client, React Router v7, shadcn/ui (Radix + Tailwind). All components are at stable, current versions. The primary technical risk areas are: (a) the Supabase auth session race condition on page load (must resolve session before rendering protected routes), (b) Google OAuth requiring real Google Cloud Console credentials even for localhost (cannot be stubbed), and (c) the seed.sql pattern requiring both `auth.users` and `auth.identities` inserts with bcrypt hashing — a single INSERT is insufficient.

**Primary recommendation:** Scaffold the Vite project first, then wire up Supabase client + AuthContext, then add React Router protected routes, then Google OAuth config, then seed data. Each step is testable independently before the next.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 18.x | UI framework | Required by project stack |
| react-dom | 18.x | DOM renderer | Paired with React |
| typescript | 5.x | Type safety | Required by project stack |
| vite | 5.x | Build tool + dev server | Required by project stack |
| tailwindcss | 3.x | Utility CSS | Required by project stack |
| @supabase/supabase-js | 2.x | Supabase client (auth + db) | Required by project stack |
| react-router | 7.x | Client-side routing | SPA routing; v7 is current stable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | Pre-built Radix + Tailwind components | All UI components — buttons, inputs, forms |
| @radix-ui/* | latest | Headless primitives (via shadcn) | Transitively via shadcn |
| clsx | 2.x | Conditional classnames | Used in cn() helper |
| tailwind-merge | 2.x | Merge Tailwind classes without conflicts | Used in cn() helper |
| lucide-react | latest | Icon set | Default icon library for shadcn |
| vitest | 1.x | Unit test runner | Frontend testing (npm test) |
| @testing-library/react | 14.x | React component testing | Component-level unit tests |
| jsdom | 24.x | DOM environment for Vitest | Required by testing-library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-router v7 | TanStack Router | TanStack has better type safety but steeper learning curve; react-router v7 is well-documented and sufficient |
| shadcn/ui | Headless UI / MUI | shadcn is already in the project decision; Tailwind-native, no theming friction |
| Vitest | Jest | Vitest shares Vite config, zero extra setup; Jest requires separate babel transform |

**Installation (Vite scaffold):**
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install react-router @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
```

**Installation (dev dependencies):**
```bash
npm install -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── supabase.ts          # Single Supabase client instance
├── contexts/
│   └── AuthContext.tsx       # Auth state: session/user + signOut
├── hooks/
│   └── useAuth.ts            # Convenience hook — useContext(AuthContext)
├── components/
│   ├── ui/                   # shadcn generated components live here
│   ├── ProtectedRoute.tsx    # Route guard component
│   ├── AppShell.tsx          # Sidebar + content layout wrapper
│   └── Sidebar.tsx           # Nav sidebar with links
├── pages/
│   ├── AuthPage.tsx          # /auth — sign in / create account toggle
│   ├── WheelPage.tsx         # /wheel — placeholder
│   ├── SnapshotsPage.tsx     # /snapshots — placeholder
│   ├── TrendPage.tsx         # /trend — placeholder
│   └── SettingsPage.tsx      # /settings — placeholder
├── types/
│   └── database.ts           # Supabase generated types (supabase gen types)
├── App.tsx                   # Router setup
└── main.tsx                  # Entry point, AuthProvider wrapper
supabase/
├── config.toml               # Local Supabase config incl. Google OAuth
├── migrations/               # Schema migrations
└── seed.sql                  # Dev user seed data
```

### Pattern 1: Supabase Client Singleton
**What:** One shared Supabase client for the entire app.
**When to use:** Always — never create multiple clients.
**Example:**
```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/guides/auth/quickstarts/react
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Pattern 2: AuthContext with Session Race Condition Guard
**What:** React context that resolves session on mount before rendering anything. Three states: `undefined` = loading, `null` = unauthenticated, `Session` = authenticated.
**When to use:** Wrap entire app in `<AuthProvider>` at main.tsx level.
**Example:**
```typescript
// src/contexts/AuthContext.tsx
// Source: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null | undefined  // undefined = still loading
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### Pattern 3: Protected Route Component
**What:** Wrapper component that guards routes. Renders spinner while loading, redirects to /auth if unauthenticated, renders children if authenticated.
**When to use:** Wrap all authenticated routes in React Router.
**Example:**
```typescript
// src/components/ProtectedRoute.tsx
// Source: https://dev.to/ra1nbow1/building-reliable-protected-routes-with-react-router-v7-1ka0
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session } = useAuth()
  const location = useLocation()

  if (session === undefined) {
    // Still resolving — show loading state, not a redirect
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (session === null) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
```

### Pattern 4: React Router v7 Route Structure
**What:** BrowserRouter with nested routes — unauthenticated routes outside ProtectedRoute, all app routes inside.
**When to use:** App.tsx root router configuration.
**Example:**
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { WheelPage } from './pages/WheelPage'
import { SnapshotsPage } from './pages/SnapshotsPage'
import { TrendPage } from './pages/TrendPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/snapshots" element={<SnapshotsPage />} />
            <Route path="/trend" element={<TrendPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/wheel" replace />} />
            <Route path="*" element={<Navigate to="/wheel" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### Pattern 5: Google OAuth Sign-In
**What:** Open browser tab to Google, redirect back to app with session.
**When to use:** Google OAuth button click handler on AuthPage.
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google
const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/wheel`,
    },
  })
  if (error) setError(error.message)
}
```

### Anti-Patterns to Avoid
- **Rendering protected content before session resolves:** `if (session === undefined) return null` causes flash-of-unauthenticated-content; use a loading spinner instead.
- **Creating Supabase client inside components:** Creates new connections on every render; always import from `lib/supabase.ts`.
- **Reading auth state from localStorage directly:** Use `supabase.auth.getSession()` and `onAuthStateChange`; Supabase manages the storage.
- **Skipping `auth.identities` in seed.sql:** Newer Supabase versions require an identity record; a user without one cannot sign in.
- **Using `supabase.auth.getUser()` instead of `getSession()` for initial load:** `getUser()` makes a network round-trip to validate the JWT; `getSession()` is local and fast for the initial render.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence across refresh | Custom localStorage/cookie logic | Supabase `onAuthStateChange` + `getSession()` | Supabase handles token refresh, expiry, and tab sync automatically |
| Form field validation | Custom regex validators | React controlled components + HTML5 validation or zod | Edge cases in email/password validation are many |
| Password hashing in seed.sql | Plain-text passwords in INSERT | `crypt(password, gen_salt('bf'))` via pgcrypto | Supabase Auth uses bcrypt; plain-text passwords cannot be verified |
| Conditional class merging | String concatenation | `cn()` from clsx + tailwind-merge | Tailwind class conflicts (e.g., two `bg-` classes) silently break styles |
| UI component primitives | Custom accessible button/input | shadcn/ui components | Radix handles focus management, ARIA, keyboard navigation |
| Protected route logic | Redirect in every page component | Single `ProtectedRoute` wrapper component | DRY; centralized auth guard is easier to maintain |

**Key insight:** Supabase manages the entire auth lifecycle including token storage, refresh, and cross-tab sync. The app only needs to observe what Supabase reports via `onAuthStateChange`.

---

## Common Pitfalls

### Pitfall 1: Auth Session Race Condition
**What goes wrong:** App renders the ProtectedRoute redirect to `/auth` before the session has been fetched from storage, so authenticated users are briefly sent to the login page on every refresh.
**Why it happens:** `useState(null)` starts as null (unauthenticated), but `getSession()` is async. If the guard checks `session === null` before the promise resolves, it redirects.
**How to avoid:** Use `undefined` as the initial session state. `undefined` = loading (show spinner), `null` = confirmed unauthenticated (redirect), `Session` = authenticated.
**Warning signs:** Users see the auth page flash briefly on refresh before being redirected back.

### Pitfall 2: Google OAuth Callback Mismatch
**What goes wrong:** Google OAuth returns an error or loops back to the consent screen.
**Why it happens:** The Authorized Redirect URI in Google Cloud Console must exactly match the Supabase local callback URL. The URI is `http://127.0.0.1:54321/auth/v1/callback` — note `127.0.0.1` not `localhost`.
**How to avoid:** Add `http://127.0.0.1:54321/auth/v1/callback` to Google Cloud Console Authorized Redirect URIs. Also ensure `supabase/config.toml` has the `[auth.external.google]` section and the credentials are provided.
**Warning signs:** Google redirects to an error page, or the Supabase callback returns `provider_not_found`.

### Pitfall 3: Seed User Cannot Sign In
**What goes wrong:** `free@test.com` exists in `auth.users` but login fails with invalid credentials.
**Why it happens:** Either (a) the password was not hashed with bcrypt (`crypt(password, gen_salt('bf'))`), or (b) there is no corresponding row in `auth.identities` for the email provider.
**How to avoid:** The seed.sql must insert into BOTH `auth.users` (with `encrypted_password = crypt('test123', gen_salt('bf'))`) AND `auth.identities` (with `provider = 'email'`, `provider_id = user_id`).
**Warning signs:** `Invalid login credentials` from Supabase when the email clearly exists in auth.users.

### Pitfall 4: Google OAuth Requires Real Credentials (Cannot Be Stubbed Locally)
**What goes wrong:** Developer expects to test Google OAuth without a Google Cloud Console project.
**Why it happens:** Supabase local auth proxies to the real OAuth provider. There is no mock/stub for social providers in local Supabase.
**How to avoid:** Create a Google Cloud project, create OAuth credentials, add the local callback URI, put the client_id/secret in config.toml. This is a one-time setup per developer machine. Document this in README/CONTRIBUTING.
**Warning signs:** `Provider is not enabled` or OAuth consent screen never appears.

### Pitfall 5: shadcn/ui Path Alias Not Configured
**What goes wrong:** `import { Button } from "@/components/ui/button"` fails to resolve.
**Why it happens:** Vite requires `resolve.alias` in `vite.config.ts` AND TypeScript requires `paths` in `tsconfig.app.json`. Missing either breaks imports.
**How to avoid:** Configure both. `npx shadcn@latest init` handles this automatically if run after project creation.
**Warning signs:** Build error `Cannot find module '@/components/ui/button'`.

### Pitfall 6: RLS Not Enabled on New Tables
**What goes wrong:** A table created for Phase 1 (or any phase) is accessible to all authenticated users — no row isolation.
**Why it happens:** PostgreSQL tables do not have RLS enabled by default. Supabase auto-generated REST APIs respect RLS policies, but if RLS is off, policies are ignored.
**How to avoid:** Every migration that creates a table MUST include `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`. Phase 1 creates no user-data tables (auth is handled by Supabase's own schema), but this is the pattern to establish from day one.
**Warning signs:** Users can query other users' data. Studio shows "RLS disabled" badge on table.

---

## Code Examples

### Supabase config.toml — Google OAuth
```toml
# supabase/config.toml
# Source: https://supabase.com/docs/guides/auth/social-login/auth-google

[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/wheel", "http://localhost:5173/auth"]

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
```

### Environment variables
```bash
# .env.local (frontend — never commit)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase status>

# supabase/.env.local (Supabase CLI — never commit)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<from Google Cloud Console>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

### seed.sql — Auth user seeding
```sql
-- supabase/seed.sql
-- Source: https://laros.io/seeding-users-in-supabase-with-a-sql-seed-script
-- Source: https://github.com/orgs/supabase/discussions/35391

-- Free-tier dev user
DO $$
DECLARE
  free_user_id uuid := gen_random_uuid();
  premium_user_id uuid := gen_random_uuid();
BEGIN

  -- Insert free user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    free_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'free@test.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Free Tester"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    free_user_id,
    free_user_id::text,
    jsonb_build_object('sub', free_user_id::text, 'email', 'free@test.com'),
    'email',
    now(), now(), now()
  );

  -- Insert premium user (same pattern)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    premium_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'premium@test.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Premium Tester"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    premium_user_id,
    premium_user_id::text,
    jsonb_build_object('sub', premium_user_id::text, 'email', 'premium@test.com'),
    'email',
    now(), now(), now()
  );

END $$;
```

### Tailwind warm/earthy palette (tailwind.config.ts)
```typescript
// tailwind.config.ts
// Using Tailwind built-in: amber (warm yellow), stone (earthy brown-gray), orange (accent)
// These are Claude's discretion — the direction is locked, exact values are flexible
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Primary warm/earthy brand palette
        brand: {
          50:  '#fdf8f0',  // warm off-white backgrounds
          100: '#faefd8',
          200: '#f5d9a8',
          300: '#efc06b',
          400: '#e8a23a',  // primary amber
          500: '#d4841a',
          600: '#b56a10',
          700: '#8f500f',
          800: '#6b3d10',
          900: '#4d2d0f',
        },
        // Sidebar / neutral: stone (warm gray)
        surface: {
          DEFAULT: '#fdf8f0',
          sidebar: '#292524',  // stone-800 — dark sidebar
        }
      }
    }
  }
}
export default config
```

### Vitest config in vite.config.ts
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-router-dom` package | `react-router` package (v7) | React Router v7 (Nov 2024) | `react-router-dom` still works (re-exports), but import from `react-router` directly |
| `supabase/auth-helpers-react` | `@supabase/supabase-js` only | Supabase auth refactor (2024) | Auth helpers deprecated; all auth in the main client |
| `shadcn-ui` CLI | `shadcn` CLI (`npx shadcn@latest`) | shadcn rebranding (2024) | Package name changed; old npx commands still work but flag a deprecation warning |
| Manual Tailwind CSS install | `npx shadcn@latest init` handles Tailwind | shadcn v2 (2024) | shadcn init configures Tailwind + PostCSS automatically |

**Deprecated/outdated:**
- `@supabase/auth-helpers-react`: Deprecated. Use `@supabase/supabase-js` session management directly.
- `react-router-dom` separate install: Not needed for v7 — `react-router` exports browser utilities.
- `npx shadcn-ui@latest`: Old package name; use `npx shadcn@latest` instead.

---

## Open Questions

1. **Google OAuth developer setup requirement**
   - What we know: Google OAuth requires a real Google Cloud project + OAuth credentials. There is no local mock. Every developer must create their own credentials or share one set.
   - What's unclear: Whether the project will document a shared set of dev credentials vs. requiring each dev to create their own.
   - Recommendation: Document in README that Google OAuth setup requires one-time Google Cloud configuration. Provide the exact steps. The email/password flow works without any Google setup.

2. **Supabase type generation timing**
   - What we know: `supabase gen types typescript --local > src/types/database.ts` generates typed DB access. Phase 1 may have no public schema tables yet (auth tables are in the `auth` schema, not `public`).
   - What's unclear: Whether to generate types for an empty public schema or defer until Phase 2 adds tables.
   - Recommendation: Create `src/types/database.ts` as a placeholder file on Phase 1. Regenerate after Phase 2 adds wheel/category tables.

3. **Email confirmation on local signup**
   - What we know: Supabase local emulator runs an SMTP server on port 54324. By default, email confirmation may be required for new registrations.
   - What's unclear: Whether the local config.toml should disable email confirmation for dev simplicity.
   - Recommendation: Add `[auth] enable_confirmations = false` to `supabase/config.toml` for local dev. This allows immediate sign-in after registration without checking the local SMTP inbox.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 1.x + @testing-library/react 14.x |
| Config file | `vite.config.ts` (test section) — created in Wave 0 |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password signUp call invokes Supabase | unit (mock) | `npm test -- --run src/pages/AuthPage.test.tsx` | Wave 0 |
| AUTH-02 | Google OAuth button calls signInWithOAuth | unit (mock) | `npm test -- --run src/pages/AuthPage.test.tsx` | Wave 0 |
| AUTH-04 | ProtectedRoute renders spinner while session=undefined, redirects when null | unit | `npm test -- --run src/components/ProtectedRoute.test.tsx` | Wave 0 |
| AUTH-05 | Sign-out button calls supabase.auth.signOut | unit (mock) | `npm test -- --run src/components/Sidebar.test.tsx` | Wave 0 |
| DEV-01 | `free@test.com` exists and can sign in | manual smoke | `supabase db reset && manual login test` | Manual only |
| DEV-02 | `premium@test.com` exists with 4+ snapshots | manual smoke | `supabase db reset && manual login test` | Manual only |
| DEV-03/04 | Seed data quality (mixed trajectories, action item mix) | manual smoke | Visual inspection in Supabase Studio | Manual only |

Note: DEV-01 through DEV-04 cannot be fully automated because they require a running Supabase instance and involve the auth.users table which is not accessible via the public anon key.

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual smoke test of both seed users before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/test/setup.ts` — Vitest + jest-dom setup file
- [ ] `src/pages/AuthPage.test.tsx` — covers AUTH-01, AUTH-02
- [ ] `src/components/ProtectedRoute.test.tsx` — covers AUTH-04
- [ ] `src/components/Sidebar.test.tsx` — covers AUTH-05
- [ ] `vite.config.ts` test configuration block
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom`

---

## Sources

### Primary (HIGH confidence)
- https://supabase.com/docs/guides/auth/social-login/auth-google — Google OAuth config.toml + redirect URI
- https://supabase.com/docs/reference/javascript/auth-onauthstatechange — onAuthStateChange event types + cleanup pattern
- https://supabase.com/docs/guides/auth/quickstarts/react — React Auth quickstart
- https://ui.shadcn.com/docs/installation/vite — shadcn/ui Vite installation

### Secondary (MEDIUM confidence)
- https://laros.io/seeding-users-in-supabase-with-a-sql-seed-script — seed.sql pattern for auth.users + auth.identities with bcrypt (cross-verified with Supabase GitHub discussion #35391)
- https://gist.github.com/khattaksd/4e8f4c89f4e928a2ecaad56d4a17ecd1 — auth.identities provider_id field (cross-verified)
- https://dev.to/ra1nbow1/building-reliable-protected-routes-with-react-router-v7-1ka0 — ProtectedRoute v7 pattern with isLoading guard
- https://github.com/orgs/supabase/discussions/35391 — Seeding auth.users discussion (official Supabase GitHub)

### Tertiary (LOW confidence)
- Tailwind warm palette hex values — suggested values only; exact values are Claude's discretion per CONTEXT.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified via npm search and official docs
- Architecture: HIGH — patterns sourced from official Supabase docs and verified React Router v7 documentation
- Pitfalls: HIGH — Google OAuth redirect URI mismatch and seed.sql identity requirement verified via multiple Supabase GitHub discussions and official docs
- Tailwind color palette: MEDIUM — specific hex values are discretionary; direction (warm/earthy) is locked per CONTEXT.md

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (90 days — stack is stable, no fast-moving changes expected)
