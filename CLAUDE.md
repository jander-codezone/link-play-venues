# CLAUDE.md — Link&Play Venue Dashboard

## 1. Project Description

SaaS dashboard for **Link&Play**, a platform connecting music venues with artists. A single React app serves two distinct user types — **venues** (who book artists) and **artistas/representantes** (who manage bookings) — with shared routes rendered conditionally based on user type.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite (SWC) |
| Language | TypeScript 5 |
| Routing | React Router DOM v6 |
| State/Data | TanStack Query v5 |
| UI Components | shadcn/ui (Radix UI + Tailwind CSS v3) |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Payments | Stripe (via Supabase Edge Functions) |
| Toast | Sonner + shadcn toast |
| Package manager | bun (lockfile present) or npm |

---

## 3. Main Architecture & Directories

```
src/
├── App.tsx                    # Root router — all routes defined here
├── main.tsx                   # Entry point
├── contexts/
│   └── AuthContext.tsx        # Global auth state (user, session, profile)
├── components/
│   ├── UserTypeRouter.tsx     # Renders venue or artista view per route
│   ├── layout/
│   │   ├── AppLayout.tsx      # Shell: fixed sidebar + main content (pl-64)
│   │   └── AppSidebar.tsx     # Left sidebar, nav, user profile footer
│   ├── ai/                    # AI proposal dialog (calendar)
│   ├── artistas/              # Artist card components
│   ├── calendario/            # Weekly calendar + artist pool
│   ├── configuracion/         # Availability, exceptions, artist management
│   ├── dashboard/             # Widget components for dashboard
│   └── ui/                    # Auto-generated shadcn primitives (do not modify manually)
├── hooks/                     # Data hooks (useArtistas, useEventos, useContrataciones, etc.)
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client singleton
│       └── types.ts           # Auto-generated DB types (do not edit manually)
├── lib/
│   ├── subscription-tiers.ts  # Stripe price/product IDs for artistas & representantes
│   └── utils.ts               # cn() + formatNumber helpers
└── pages/
    ├── Auth.tsx / AuthCallback.tsx
    ├── Dashboard.tsx           # Venue dashboard
    ├── Artistas.tsx / ArtistaDetalle.tsx / ArtistasPremium.tsx / ArtistasFavoritos.tsx
    ├── Calendario.tsx
    ├── Contrataciones.tsx
    ├── Facturacion.tsx
    ├── Notificaciones.tsx
    ├── Suscripciones.tsx       # Venue subscription plans (hardcoded Stripe IDs here)
    ├── Configuracion.tsx
    └── artista/               # All artista/representante page variants
        ├── ArtistaDashboard.tsx
        ├── ArtistaCalendario.tsx
        ├── ArtistaContrataciones.tsx
        ├── ArtistaFacturacion.tsx
        ├── ArtistaNotificaciones.tsx
        ├── ArtistaSuscripciones.tsx
        └── ArtistaConfiguracion.tsx
```

**Routing pattern:** All protected routes live inside `<AppLayout>`. Shared routes (calendario, contrataciones, facturacion, notificaciones, suscripciones, configuracion) use `<UserTypeRouter venue={<X/>} artista={<Y/>}/>` to swap the rendered component based on `profile.tipo_usuario`.

---

## 4. Supabase Integration

**Client:** `src/integrations/supabase/client.ts` — import as `import { supabase } from "@/integrations/supabase/client"`.

**Environment variables (in `.env`):**
```
VITE_SUPABASE_URL=https://ggwnpvavqvsgyetgkxoo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
```

**Database tables:**

| Table | Purpose |
|---|---|
| `user_profiles` | Auth-linked profiles (used by AuthContext). Has `tipo_usuario` enum and `subtipo_venue`. |
| `perfiles` | Legacy profile table referenced by `artistas` (perfil_artista_id, representante_id). |
| `artistas` | Artist catalog. Links to `perfiles` for artist/representante user accounts. |
| `negocios` | Venue/business profiles. |
| `espacios` | Physical spaces owned by venue users. |
| `eventos` | Scheduled events (artista_id, fecha, hora_inicio). No direct negocio_id FK. |
| `contrataciones` | Confirmed bookings (artista_id + negocio_id + evento_id + cache_pagado). |
| `notificaciones` | Per-artista notifications linked to events. |
| `artista_disponibilidad` | Date-specific availability exceptions for artists. |
| `artista_disponibilidad_semanal` | Weekly recurring availability for artists. |
| `artista_disponibilidad_premium` | Premium artist availability with city/price info. |
| `espacio_disponibilidad` | Venue space availability calendar. |

**DB enums:**
- `user_type`: `"venue" | "artista" | "representante"`
- `venue_subtype`: `"contratante" | "espacio" | "ambos"`

**Edge Functions (called via `supabase.functions.invoke`):**
- `create-checkout` — Creates Stripe checkout session
- `check-subscription` — Returns `{ subscribed, product_id, subscription_end }`
- `customer-portal` — Opens Stripe billing portal
- `ai-recommendations` — AI calendar suggestions (body: `{ type: "calendar", negocioId, fechaInicio, fechaFin, presupuestoSemanal }`)

**Types:** `src/integrations/supabase/types.ts` is auto-generated. Regenerate with the Supabase CLI when schema changes.

---

## 5. Authentication Flow

- **Provider:** `AuthContext` (`src/contexts/AuthContext.tsx`) wraps the app.
- **Methods:** email/password (`signIn`, `signUp`) and Google OAuth (`signInWithGoogle`).
- **OAuth callback:** `/auth/callback` → `AuthCallback.tsx`.
- **Profile creation:** DB trigger auto-creates `user_profiles` row on `auth.users` insert. The `signUp` function passes `nombre`, `tipo_usuario`, `telefono`, `subtipo_venue` in `options.data` for the trigger to use.
- **Profile fetch:** Uses `setTimeout(0)` inside `onAuthStateChange` to avoid a Supabase auth deadlock. This is intentional.
- **Auth guard:** `AppLayout` does NOT redirect unauthenticated users — the sidebar shows a "Log in" button. `UserTypeRouter` defaults to venue view for unauthenticated users.
- **Access `profile`** via `useAuth()` hook anywhere inside `AuthProvider`.

---

## 6. Stripe Integration

All Stripe operations go through Supabase Edge Functions (no direct Stripe SDK in frontend).

**Venue plans** — hardcoded in `src/pages/Suscripciones.tsx` (`PLANS` object):
- Standard: `price_1SeYjLGOghH19qqnRuI45TPQ` / `prod_TbmHPNNWG7saPQ` — €150/mo
- Premium: `price_1SeYjXGOghH19qqnXrtEj11p` / `prod_TbmIXsJ87Ay3UC` — €215/mo

**Artista/Representante plans** — in `src/lib/subscription-tiers.ts`:
- Artista Standard: `price_1Sx5xvGOghH19qqnSM4g4fw2` — €12.99/mo
- Artista Premium: `price_1Sx5y8GOghH19qqnf0h0Abmy` — €19.99/mo
- Representante Standard: `price_1Sx5yLGOghH19qqnsrxwCLsT` — €100/mo
- Representante Premium: `price_1Sx5ycGOghH19qqnAGatoqlb` — €150/mo

Trial period: **30 days** (`TRIAL_DAYS = 30` in `subscription-tiers.ts`).

Checkout opens in a **new tab** (`window.open`). If the popup is blocked, a toast with a manual link is shown.

---

## 7. Known Architectural Issues

1. **Dual profile tables:** `user_profiles` and `perfiles` coexist with overlapping structure. `AuthContext` uses `user_profiles`. The `artistas` table references `perfiles` via `perfil_artista_id`/`representante_id`. These are not the same table — be careful not to conflate them.

2. **Split Stripe config:** Venue plans are hardcoded inside `Suscripciones.tsx`; artista/representante plans are in `subscription-tiers.ts`. If prices change, both places must be updated.

3. **`eventos` has no `negocio_id` FK.** Joining events to a specific venue requires going through `contrataciones`.

4. **No auth route guard.** `AppLayout` does not redirect unauthenticated users. Venue UI is visible (but data-empty) without login.

5. **Sidebar is not responsive.** `AppLayout` hardcodes `pl-64`. There is no mobile/tablet layout.

6. **`UserTypeRouter` defaults to venue for unauthenticated users.** Until `profile` loads, venue view renders. This can cause a brief flash of wrong UI for artist users.

7. **Legacy `Sidebar.tsx` and `DashboardLayout.tsx`** exist alongside `AppSidebar.tsx` and `AppLayout.tsx`. The legacy components appear unused — do not activate them.

---

## 8. Safe Modification Rules

- **Never edit `src/integrations/supabase/types.ts` manually.** Regenerate with `supabase gen types typescript`.
- **Never edit `src/components/ui/` components directly** unless fixing a bug; they are shadcn-managed.
- **To add a new shared route** (same URL, different view per user): add it to `App.tsx` using `<UserTypeRouter>` and update the sidebar in `AppSidebar.tsx`.
- **To add a venue-only route**: add directly in `App.tsx` without `UserTypeRouter`, and guard in the sidebar with `!isArtistaUser`.
- **When modifying Stripe price IDs**: update both `Suscripciones.tsx` AND `subscription-tiers.ts` as appropriate.
- **Data hooks** live in `src/hooks/`. Each wraps a TanStack Query `useQuery`/`useMutation`. Add new data access there, not inline in pages.
- **Do not** use the `perfiles` table for new features — use `user_profiles`.

---

## 9. Local Development

```bash
# Install dependencies
bun install   # or: npm install

# Start dev server
bun run dev   # or: npm run dev
# → http://localhost:5173

# Build
bun run build

# Lint
bun run lint
```

**Environment:** Copy `.env` or set these variables:
```
VITE_SUPABASE_URL=https://ggwnpvavqvsgyetgkxoo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
```

The `.env` file is already present and gitignored. No local Supabase instance is needed — the app connects directly to the hosted project (`ggwnpvavqvsgyetgkxoo`).

Edge Functions run in Supabase cloud — they cannot be tested locally without `supabase functions serve`.
