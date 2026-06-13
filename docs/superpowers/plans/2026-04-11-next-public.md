# next-public — Pages Publiques Clients Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un mini-projet Next.js 15 (`next-public/`) dans le monorepo hébergeant 3 pages publiques clients (`/brief-invite/[code]`, `/brief/[code]`, `/portal/[code]`) déployées sous `suivi.propulseo.fr`.

**Architecture:** App Router Next.js 15 avec Server Components pour les fetches Supabase côté serveur et Server Actions pour les soumissions de formulaires. Short codes 8 chars alphanum remplacent les UUID dans les URLs. Aucune clé Supabase exposée au navigateur. Les pages existantes dans le CRM Vite restent fonctionnelles pendant la migration.

**Tech Stack:** Next.js 15, React 18, TypeScript 5, Tailwind CSS 3, Supabase JS v2, Framer Motion, Lucide React, Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-11-next-public-design.md`

---

### Task 1: Supabase migrations — ajout short codes

**Files:**
- Create: `supabase/migrations/20260412_short_codes.sql`

- [ ] **Étape 1 : Écrire la migration**

Créer `supabase/migrations/20260412_short_codes.sql` :

```sql
-- supabase/migrations/20260412_short_codes.sql
-- Ajout des short codes 8 chars pour les URLs publiques (next-public)

-- 1. brief_invitations : short_code (uuid token reste valide en fallback)
ALTER TABLE public.brief_invitations
  ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_brief_invitations_short_code
  ON public.brief_invitations (short_code)
  WHERE short_code IS NOT NULL;

-- 2. projects_v2 : brief_short_code + portal_short_code + portal_expires_at
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS brief_short_code  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_short_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_brief_short_code
  ON public.projects_v2 (brief_short_code)
  WHERE brief_short_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_portal_short_code
  ON public.projects_v2 (portal_short_code)
  WHERE portal_short_code IS NOT NULL;

-- 3. RLS : anon lit brief_invitations via short_code (complète la policy "anon_read_pending" existante)
DROP POLICY IF EXISTS "anon_read_by_short_code" ON public.brief_invitations;
CREATE POLICY "anon_read_by_short_code" ON public.brief_invitations
  FOR SELECT TO anon
  USING (short_code IS NOT NULL);

-- 4. RLS : anon lit projects_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_read_by_short_code" ON public.projects_v2;
CREATE POLICY "brief_read_by_short_code" ON public.projects_v2
  FOR SELECT TO anon
  USING (brief_short_code IS NOT NULL AND brief_token_enabled = TRUE);

-- 5. RLS : anon lit projects_v2 via portal_short_code (avec expiration)
DROP POLICY IF EXISTS "portal_read_by_short_code" ON public.projects_v2;
CREATE POLICY "portal_read_by_short_code" ON public.projects_v2
  FOR SELECT TO anon
  USING (
    portal_short_code IS NOT NULL
    AND portal_enabled = TRUE
    AND (portal_expires_at IS NULL OR portal_expires_at > now())
  );

-- 6. RLS : anon lit checklist_items_v2 via portal_short_code
DROP POLICY IF EXISTS "portal_read_checklist_by_short_code" ON public.checklist_items_v2;
CREATE POLICY "portal_read_checklist_by_short_code" ON public.checklist_items_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_short_code IS NOT NULL
        AND portal_enabled = TRUE
        AND (portal_expires_at IS NULL OR portal_expires_at > now())
    )
  );

-- 7. RLS : anon lit project_invoices_v2 via portal_short_code
DROP POLICY IF EXISTS "portal_read_invoices_by_short_code" ON public.project_invoices_v2;
CREATE POLICY "portal_read_invoices_by_short_code" ON public.project_invoices_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_short_code IS NOT NULL
        AND portal_enabled = TRUE
        AND (portal_expires_at IS NULL OR portal_expires_at > now())
    )
  );

-- 8. RLS : anon lit project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_read_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_read_briefs_by_short_code" ON public.project_briefs_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 9. RLS : anon insère dans project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_insert_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_insert_briefs_by_short_code" ON public.project_briefs_v2
  FOR INSERT TO anon
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 10. RLS : anon met à jour project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_update_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_update_briefs_by_short_code" ON public.project_briefs_v2
  FOR UPDATE TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );
```

- [ ] **Étape 2 : Appliquer via Supabase MCP**

Utiliser `mcp__plugin_supabase_supabase__apply_migration` avec :
- `project_id`: `wftozvnvstxzvfplveyz`
- `name`: `add_short_codes`
- `query`: contenu du fichier ci-dessus

Vérifier : aucune erreur retournée.

- [ ] **Étape 3 : Commit**

```bash
git add supabase/migrations/20260412_short_codes.sql
git commit -m "feat(db): add short_code columns + RLS policies for next-public"
```

---

### Task 2: Update Edge Function create-project-from-brief

**Files:**
- Modify: `supabase/functions/create-project-from-brief/index.ts`

- [ ] **Étape 1 : Lire l'Edge Function en entier**

Lire `supabase/functions/create-project-from-brief/index.ts` en entier pour connaître la structure exacte avant de modifier.

- [ ] **Étape 2 : Modifier le parsing du body**

Trouver :
```ts
const { token, companyName, fields } = await req.json() as {
  token: string;
  companyName: string;
  fields: Record<string, string | null>;
};

if (!token || !companyName?.trim()) {
```

Remplacer par :
```ts
const { token, short_code, companyName, fields } = await req.json() as {
  token?: string;
  short_code?: string;
  companyName: string;
  fields: Record<string, string | null>;
};

if (!token && !short_code) {
  return new Response(
    JSON.stringify({ ok: false, error: "token ou short_code requis" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
if (!companyName?.trim()) {
```

- [ ] **Étape 3 : Modifier le lookup de l'invitation**

Trouver :
```ts
const { data: invitation, error: invErr } = await supabase
  .from("brief_invitations")
  .select("id, status, company_name")
  .eq("token", token)
  .single();
```

Remplacer par :
```ts
const invQuery = supabase
  .from("brief_invitations")
  .select("id, status, company_name");

const { data: invitation, error: invErr } = await (
  short_code
    ? invQuery.eq("short_code", short_code)
    : invQuery.eq("token", token!)
).single();
```

- [ ] **Étape 4 : Déployer l'Edge Function**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main
npx supabase functions deploy create-project-from-brief --project-ref wftozvnvstxzvfplveyz
```

Attendu : `✓ Deployed Function create-project-from-brief`

- [ ] **Étape 5 : Commit**

```bash
git add supabase/functions/create-project-from-brief/index.ts
git commit -m "feat(edge): create-project-from-brief accepte short_code en plus de token"
```

---

### Task 3: CRM Vite — génération des short codes

**Files:**
- Create: `src/lib/shortCode.ts`
- Modify: `src/modules/ClientPortal/useClientPortal.ts`
- Modify: `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts`
- Find + Modify: le composant qui insère dans `brief_invitations`

- [ ] **Étape 1 : Créer src/lib/shortCode.ts**

```ts
// src/lib/shortCode.ts
// Alphabet sans caractères ambigus : 0/O, I/l, 1 exclus
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => CHARS[b % CHARS.length])
    .join('')
}
```

- [ ] **Étape 2 : Mettre à jour useClientPortal.ts**

Ajouter l'import en haut de `src/modules/ClientPortal/useClientPortal.ts` :
```ts
import { generateShortCode } from '@/lib/shortCode'
```

Trouver `generateToken` (commence à `const generateToken = useCallback`) et remplacer par :
```ts
const generateToken = useCallback(async (projectId: string): Promise<string | null> => {
  const token = crypto.randomUUID()
  const shortCode = generateShortCode()
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('projects_v2')
    .update({
      portal_token: token,
      portal_enabled: true,
      portal_short_code: shortCode,
      portal_expires_at: expiresAt,
    })
    .eq('id', projectId)
  if (error) return null
  return shortCode // retourne le short code pour construire le lien
}, [])
```

Note: les appelants de `generateToken` qui construisent l'URL doivent utiliser :
`https://suivi.propulseo.fr/portal/${shortCode}` — vérifier avec `grep -r "generateToken" src/`.

- [ ] **Étape 3 : Mettre à jour useBriefV2.ts — enableBriefToken**

Ajouter l'import en haut de `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts` :
```ts
import { generateShortCode } from '@/lib/shortCode'
```

Trouver `enableBriefToken` et remplacer par :
```ts
const enableBriefToken = useCallback(async (): Promise<string | null> => {
  const token = crypto.randomUUID()
  const shortCode = generateShortCode()
  const { error } = await supabase
    .from('projects_v2')
    .update({ brief_token: token, brief_token_enabled: true, brief_short_code: shortCode })
    .eq('id', projectId)
  if (error) return null
  setBriefToken(token)
  setTokenEnabled(true)
  return shortCode // retourne le short code pour le lien
}, [projectId])
```

Note: les appelants qui construisent l'URL brief doivent utiliser :
`https://suivi.propulseo.fr/brief/${shortCode}`.

- [ ] **Étape 4 : Trouver et mettre à jour la création d'invitation**

```bash
grep -r "brief_invitations" /Users/trikilyes/Desktop/Privé/CRMPropulseo-main/src --include="*.tsx" --include="*.ts" -l
```

Ouvrir chaque fichier trouvé et localiser le `.insert(` sur `brief_invitations`. Ajouter `short_code` dans le payload :

```ts
import { generateShortCode } from '@/lib/shortCode'

// Dans la fonction de création :
const { data, error } = await supabase
  .from('brief_invitations')
  .insert({
    company_name: companyName,
    short_code: generateShortCode(), // ← ajout
    // ... autres champs inchangés
  })
  .select()
  .single()

// Le lien à partager :
const link = `https://suivi.propulseo.fr/brief-invite/${data.short_code}`
```

- [ ] **Étape 5 : Commit**

```bash
git add src/lib/shortCode.ts src/modules/ClientPortal/useClientPortal.ts src/modules/ProjectsManagerV2/hooks/useBriefV2.ts
git commit -m "feat(crm): génération short codes 8 chars pour liens brief + portal"
```

---

### Task 4: Scaffold next-public/

**Files:**
- Create: `next-public/package.json`
- Create: `next-public/next.config.ts`
- Create: `next-public/tailwind.config.ts`
- Create: `next-public/postcss.config.js`
- Create: `next-public/tsconfig.json`
- Create: `next-public/jest.config.ts`
- Create: `next-public/.env.example`
- Create: `next-public/.gitignore`

- [ ] **Étape 1 : Créer next-public/package.json**

```json
{
  "name": "propulseo-public",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.49.4",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.511.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "@types/node": "^22.15.3",
    "@types/react": "^18.3.20",
    "@types/react-dom": "^18.3.5",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.3",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.25.1",
    "eslint-config-next": "15.3.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.14",
    "ts-jest": "^29.3.2"
  }
}
```

- [ ] **Étape 2 : Créer next-public/next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default nextConfig
```

- [ ] **Étape 3 : Créer next-public/tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config
```

- [ ] **Étape 4 : Créer next-public/postcss.config.js**

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Étape 5 : Créer next-public/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Étape 6 : Créer next-public/jest.config.ts**

```ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
}

export default config
```

- [ ] **Étape 7 : Créer next-public/.env.example**

```
# Supabase — sans préfixe VITE_
SUPABASE_URL=https://wftozvnvstxzvfplveyz.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Étape 8 : Créer next-public/.gitignore**

```
.env.local
.next/
node_modules/
```

- [ ] **Étape 9 : Installer les dépendances**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main/next-public && npm install
```

Attendu : aucune erreur, `node_modules/` créé.

- [ ] **Étape 10 : Commit**

```bash
cd .. && git add next-public/package.json next-public/next.config.ts next-public/tailwind.config.ts next-public/postcss.config.js next-public/tsconfig.json next-public/jest.config.ts next-public/.env.example next-public/.gitignore
git commit -m "feat(next-public): scaffold projet Next.js 15 App Router"
```

---

### Task 5: Utils, lib Supabase, et tests

**Files:**
- Create: `next-public/lib/utils.ts`
- Create: `next-public/lib/supabase-server.ts`
- Create: `next-public/__tests__/utils.test.ts`

- [ ] **Étape 1 : Écrire le test (TDD — doit échouer)**

Créer `next-public/__tests__/utils.test.ts` :

```ts
import { generateShortCode, cn, formatDate } from '../lib/utils'

describe('generateShortCode', () => {
  it('retourne exactement 8 caractères', () => {
    expect(generateShortCode()).toHaveLength(8)
  })

  it('utilise uniquement les caractères autorisés (pas 0/O/I/l/1)', () => {
    const allowed = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 50; i++) {
      expect(generateShortCode()).toMatch(allowed)
    }
  })

  it('génère des codes différents à chaque appel', () => {
    const codes = new Set(Array.from({ length: 100 }, generateShortCode))
    expect(codes.size).toBe(100)
  })
})

describe('cn', () => {
  it('concatène des classes', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('a', false as unknown as string, undefined, 'b')).toBe('a b')
  })

  it('fusionne les conflits tailwind (dernière valeur gagne)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    const result = formatDate('2026-04-11')
    expect(result).toMatch(/11/)
    expect(result).toMatch(/avril|avr/i)
    expect(result).toMatch(/2026/)
  })

  it('retourne un tiret pour null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('retourne un tiret pour undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })
})
```

- [ ] **Étape 2 : Lancer le test (doit échouer)**

```bash
cd next-public && npx jest __tests__/utils.test.ts --no-coverage 2>&1 | tail -5
```

Attendu : FAIL — `Cannot find module '../lib/utils'`

- [ ] **Étape 3 : Créer next-public/lib/utils.ts**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Alphabet sans caractères ambigus (0/O, I/l, 1 exclus)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => CHARS[b % CHARS.length])
    .join('')
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
```

- [ ] **Étape 4 : Lancer le test (doit passer)**

```bash
npx jest __tests__/utils.test.ts --no-coverage
```

Attendu : PASS — 3 suites, 8 tests verts.

- [ ] **Étape 5 : Créer next-public/lib/supabase-server.ts**

```ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseServer() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
```

- [ ] **Étape 6 : Commit**

```bash
cd .. && git add next-public/lib/ next-public/__tests__/
git commit -m "feat(next-public): utils + supabase-server + tests TDD"
```

---

### Task 6: Composants partagés + layout

**Files:**
- Create: `next-public/components/Orb.tsx`
- Create: `next-public/components/Logo.tsx`
- Create: `next-public/components/PageShell.tsx`
- Create: `next-public/components/GlassCard.tsx`
- Create: `next-public/app/globals.css`
- Create: `next-public/app/layout.tsx`
- Create: `next-public/app/not-found.tsx`
- Create: `next-public/app/page.tsx`

- [ ] **Étape 1 : Créer next-public/components/Orb.tsx**

```tsx
export function Orb({ style }: { style: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }}
    />
  )
}
```

- [ ] **Étape 2 : Créer next-public/components/Logo.tsx**

```tsx
const LOGO_URL =
  'https://lh3.googleusercontent.com/pw/AP1GczN1Fx4MCRF05ZyLZ8eE7yq6l3O04S9H5NUlRQng3NGehC4bVTl4SA0EdX8yJ4cEgMGjbPkELigm1WxcMBR8QCh4QSMgDVikjqv8mizSPn2r-zv-pKbMK10JVMTK4Fo1kd4VUXASX_owtWiT6X6cRao=w590-h423-s-no-gm?authuser=0'

export function Logo({ size = 48 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_URL}
      alt="Propulseo"
      width={size}
      height={Math.round(size * 423 / 590)}
      style={{ objectFit: 'contain' }}
    />
  )
}
```

- [ ] **Étape 3 : Créer next-public/components/PageShell.tsx**

```tsx
import { Orb } from './Orb'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0118',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <Orb style={{ width: 500, height: 500, top: -100, left: -150, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, bottom: -80, right: -100, background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)' }} />
      <Orb style={{ width: 300, height: 300, top: '40%', left: '60%', background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)' }} />
      {children}
    </div>
  )
}
```

- [ ] **Étape 4 : Créer next-public/components/GlassCard.tsx**

```tsx
import { cn } from '@/lib/utils'

export function GlassCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn(className)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Étape 5 : Créer next-public/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  background: #0a0118;
  overscroll-behavior: none;
}

body {
  color: white;
  font-family: var(--font-inter), system-ui, sans-serif;
}
```

- [ ] **Étape 6 : Créer next-public/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Propulseo',
  description: 'Espace client Propulseo',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Étape 7 : Créer next-public/app/not-found.tsx**

```tsx
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'

export default function NotFound() {
  return (
    <PageShell>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}>
        <Logo size={56} />
        <h1 style={{ color: 'white', fontSize: 20, fontWeight: 600, textAlign: 'center' }}>
          Lien invalide ou expiré
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
          Ce lien n&apos;existe pas ou a déjà été utilisé.<br />
          Contactez votre chargé de projet Propulseo.
        </p>
      </div>
    </PageShell>
  )
}
```

- [ ] **Étape 8 : Créer next-public/app/page.tsx (racine — redirect)**

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('https://propulseo.fr')
}
```

- [ ] **Étape 9 : Commit**

```bash
git add next-public/components/ next-public/app/globals.css next-public/app/layout.tsx next-public/app/not-found.tsx next-public/app/page.tsx
git commit -m "feat(next-public): composants Dark Premium + layout + 404"
```

---

### Task 7: Page /brief-invite/[code]

**Files:**
- Create: `next-public/app/brief-invite/[code]/page.tsx`
- Create: `next-public/app/brief-invite/[code]/actions.ts`
- Create: `next-public/app/brief-invite/[code]/BriefInviteForm.tsx`

Référence design : lire `src/modules/ClientBrief/ClientBriefInvitePage.tsx` avant d'écrire.

- [ ] **Étape 1 : Créer actions.ts (Server Action)**

```ts
// next-public/app/brief-invite/[code]/actions.ts
'use server'

export async function submitBriefInvite(
  code: string,
  companyName: string,
  fields: Record<string, string>
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/create-project-from-brief`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ short_code: code, companyName, fields }),
      }
    )
    const json = await res.json()
    return { ok: json.ok === true }
  } catch {
    return { ok: false }
  }
}
```

- [ ] **Étape 2 : Créer page.tsx (Server Component)**

```tsx
// next-public/app/brief-invite/[code]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { BriefInviteForm } from './BriefInviteForm'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('brief_invitations')
    .select('company_name')
    .eq('short_code', code)
    .single()
  return {
    title: `Brief projet — ${data?.company_name ?? 'Propulseo'}`,
    description: 'Complétez votre brief projet en quelques minutes.',
    robots: 'noindex, nofollow',
  }
}

export default async function BriefInvitePage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()

  const { data: invitation } = await supabase
    .from('brief_invitations')
    .select('id, short_code, company_name, status')
    .eq('short_code', code)
    .single()

  if (!invitation) notFound()

  if (invitation.status === 'submitted') {
    return (
      <PageShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}>
          <Logo size={56} />
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 600, textAlign: 'center' }}>
            Brief déjà envoyé
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
            Votre brief a bien été reçu par l&apos;équipe Propulseo.<br />
            Nous reviendrons vers vous très prochainement.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <BriefInviteForm
      code={code}
      companyName={invitation.company_name ?? ''}
    />
  )
}
```

- [ ] **Étape 3 : Créer BriefInviteForm.tsx (Client Component)**

```tsx
// next-public/app/brief-invite/[code]/BriefInviteForm.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, Building2, CheckCircle2 } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { submitBriefInvite } from './actions'

const FIELDS = [
  { key: 'objective',         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience',   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages',             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno',            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references', label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes',             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
] as const

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

function FieldCard({
  field, index, value, onChange,
}: {
  field: typeof FIELDS[number]; index: number; value: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const ref = useAutoResize(value)
  const filled = value.trim().length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1.5px solid ${focused ? 'rgba(167,139,250,0.6)' : filled ? 'rgba(167,243,208,0.5)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AnimatePresence mode="wait">
          {filled ? (
            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <CheckCircle2 size={14} style={{ color: '#6ee7b7' }} />
            </motion.div>
          ) : (
            <motion.div key="dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </motion.div>
          )}
        </AnimatePresence>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {field.label}
          {'required' in field && field.required && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field.placeholder}
        rows={field.rows}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
      />
    </motion.div>
  )
}

export function BriefInviteForm({ code, companyName }: { code: string; companyName: string }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, '']))
  )
  const [companyInput, setCompanyInput] = useState(companyName)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!values.objective.trim()) { setError("L'objectif du projet est requis."); return }
    setSubmitting(true); setError(null)
    const result = await submitBriefInvite(code, companyInput || companyName, values)
    if (result.ok) setSubmitted(true)
    else setError('Une erreur est survenue. Veuillez réessayer.')
    setSubmitting(false)
  }, [code, companyInput, companyName, values])

  if (submitted) {
    return (
      <PageShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: 24 }}
        >
          <Logo size={56} />
          <CheckCircle2 size={48} style={{ color: '#6ee7b7' }} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>Brief envoyé avec succès !</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
            L&apos;équipe Propulseo a bien reçu votre brief.<br />
            Nous reviendrons vers vous très prochainement.
          </p>
        </motion.div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <Logo size={56} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>Brief de projet</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
            Décrivez votre projet pour que notre équipe puisse vous préparer une proposition adaptée.
          </p>
        </motion.div>

        {/* Nom entreprise */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Building2 size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            placeholder="Nom de votre entreprise"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 14, width: '100%', fontFamily: 'inherit' }}
          />
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FIELDS.map((field, i) => (
            <FieldCard
              key={field.key}
              field={field}
              index={i}
              value={values[field.key]}
              onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: '#f87171', fontSize: 13 }}>
              <AlertCircle size={14} />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={handleSubmit} disabled={submitting}
          style={{ marginTop: 24, width: '100%', padding: '14px 24px', background: submitting ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
        >
          {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
          {submitting ? 'Envoi en cours…' : 'Envoyer le brief'}
        </motion.button>
      </div>
    </PageShell>
  )
}
```

- [ ] **Étape 4 : Commit**

```bash
git add next-public/app/brief-invite/
git commit -m "feat(next-public): page /brief-invite/[code] Dark Premium + Server Action"
```

---

### Task 8: Page /brief/[code]

**Files:**
- Create: `next-public/app/brief/[code]/page.tsx`
- Create: `next-public/app/brief/[code]/actions.ts`
- Create: `next-public/app/brief/[code]/BriefForm.tsx`

Référence design : lire `src/modules/ClientBrief/ClientBriefPage.tsx` avant d'écrire.

- [ ] **Étape 1 : Créer actions.ts**

```ts
// next-public/app/brief/[code]/actions.ts
'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

interface BriefFields {
  objective: string
  target_audience: string
  pages: string
  techno: string
  design_references: string
  notes: string
}

export async function submitBrief(
  projectId: string,
  briefId: string | null,
  projectName: string,
  fields: BriefFields
): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServer()
  const payload = { ...fields, submitted_at: new Date().toISOString() }

  let dbError: unknown
  if (briefId) {
    const result = await supabase.from('project_briefs_v2').update(payload).eq('id', briefId)
    dbError = result.error
  } else {
    const result = await supabase.from('project_briefs_v2').insert({ ...payload, project_id: projectId })
    dbError = result.error
  }
  if (dbError) return { ok: false }

  // Notification email best-effort (silencieux)
  fetch(`${process.env.SUPABASE_URL}/functions/v1/send-brief-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': process.env.SUPABASE_ANON_KEY! },
    body: JSON.stringify({ projectName, fields }),
  }).catch(() => {})

  return { ok: true }
}
```

- [ ] **Étape 2 : Créer page.tsx**

```tsx
// next-public/app/brief/[code]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { BriefForm } from './BriefForm'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data: project } = await supabase
    .from('projects_v2')
    .select('name')
    .eq('brief_short_code', code)
    .eq('brief_token_enabled', true)
    .single()
  return {
    title: `Brief — ${project?.name ?? 'Propulseo'}`,
    robots: 'noindex, nofollow',
  }
}

export default async function BriefPage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()

  const { data: project } = await supabase
    .from('projects_v2')
    .select('id, name')
    .eq('brief_short_code', code)
    .eq('brief_token_enabled', true)
    .single()

  if (!project) notFound()

  const { data: brief } = await supabase
    .from('project_briefs_v2')
    .select('id, objective, target_audience, pages, techno, design_references, notes, submitted_at')
    .eq('project_id', project.id)
    .maybeSingle()

  return (
    <BriefForm
      code={code}
      projectName={project.name}
      projectId={project.id}
      brief={brief ?? null}
      alreadySubmitted={!!(brief?.submitted_at)}
    />
  )
}
```

- [ ] **Étape 3 : Créer BriefForm.tsx (Client Component)**

```tsx
// next-public/app/brief/[code]/BriefForm.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Send, Loader2, CheckCircle2, Eye } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { submitBrief } from './actions'

const FIELDS = [
  { key: 'objective' as const,         label: 'Objectif du projet',                placeholder: "Quel est l'objectif principal du projet ?",        required: true, rows: 4 },
  { key: 'target_audience' as const,   label: 'Cible / utilisateurs',              placeholder: 'Qui sont les utilisateurs cibles ?',                rows: 3 },
  { key: 'pages' as const,             label: 'Pages / Fonctionnalités attendues', placeholder: 'Listez les pages ou fonctionnalités souhaitées…',   rows: 4 },
  { key: 'techno' as const,            label: 'Technologie / stack',               placeholder: 'Stack technique ou préférences technologiques…',    rows: 2 },
  { key: 'design_references' as const, label: 'Références design',                 placeholder: 'URLs, inspirations visuelles, exemples de sites…', rows: 3 },
  { key: 'notes' as const,             label: 'Notes complémentaires',             placeholder: "Toute information utile pour l'équipe…",           rows: 3 },
] as const

type BriefData = {
  id: string
  objective?: string | null
  target_audience?: string | null
  pages?: string | null
  techno?: string | null
  design_references?: string | null
  notes?: string | null
  submitted_at?: string | null
} | null

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

function FieldCard({ field, index, value, onChange, readOnly }: {
  field: typeof FIELDS[number]; index: number; value: string; onChange: (v: string) => void; readOnly: boolean
}) {
  const [focused, setFocused] = useState(false)
  const ref = useAutoResize(value)
  const filled = value.trim().length > 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1.5px solid ${focused ? 'rgba(167,139,250,0.6)' : filled ? 'rgba(167,243,208,0.5)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        {filled ? <CheckCircle2 size={14} style={{ color: '#6ee7b7' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
        <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {field.label}
          {'required' in field && field.required && !readOnly && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={readOnly ? '—' : field.placeholder}
        rows={field.rows}
        readOnly={readOnly}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: readOnly ? 'rgba(255,255,255,0.7)' : 'white', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', cursor: readOnly ? 'default' : 'text' }}
      />
    </motion.div>
  )
}

export function BriefForm({ code, projectName, projectId, brief, alreadySubmitted }: {
  code: string; projectName: string; projectId: string; brief: BriefData; alreadySubmitted: boolean
}) {
  const [values, setValues] = useState({
    objective: brief?.objective ?? '',
    target_audience: brief?.target_audience ?? '',
    pages: brief?.pages ?? '',
    techno: brief?.techno ?? '',
    design_references: brief?.design_references ?? '',
    notes: brief?.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isReadOnly = alreadySubmitted

  const handleSubmit = useCallback(async () => {
    if (!values.objective.trim()) { setError("L'objectif est requis."); return }
    setSubmitting(true); setError(null)
    const result = await submitBrief(projectId, brief?.id ?? null, projectName, values)
    if (result.ok) setSubmitted(true)
    else setError('Une erreur est survenue. Veuillez réessayer.')
    setSubmitting(false)
  }, [projectId, brief, projectName, values])

  return (
    <PageShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <Logo size={56} />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
            {isReadOnly ? 'Votre brief' : `Brief — ${projectName}`}
          </h1>
          {isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6ee7b7', fontSize: 13 }}>
              <Eye size={14} /> Brief soumis — lecture seule
            </div>
          )}
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FIELDS.map((field, i) => (
            <FieldCard key={field.key} field={field} index={i}
              value={values[field.key]} onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
              readOnly={isReadOnly} />
          ))}
        </div>

        {!isReadOnly && (
          <>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: '#f87171', fontSize: 13 }}>
                  <AlertCircle size={14} />{error}
                </motion.div>
              )}
            </AnimatePresence>
            {submitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, color: '#6ee7b7', fontSize: 14, justifyContent: 'center' }}>
                <CheckCircle2 size={18} /> Brief envoyé avec succès !
              </motion.div>
            ) : (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                onClick={handleSubmit} disabled={submitting}
                style={{ marginTop: 24, width: '100%', padding: '14px 24px', background: submitting ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                {submitting ? <Loader2 size={18} /> : <Send size={18} />}
                {submitting ? 'Envoi…' : 'Envoyer le brief'}
              </motion.button>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
```

- [ ] **Étape 4 : Commit**

```bash
git add next-public/app/brief/
git commit -m "feat(next-public): page /brief/[code] + lecture seule si déjà soumis"
```

---

### Task 9: Page /portal/[code]

**Files:**
- Create: `next-public/app/portal/[code]/page.tsx`
- Create: `next-public/app/portal/[code]/PortalView.tsx`

Référence design : lire `src/modules/ClientPortal/ClientPortalPage.tsx` avant d'écrire.

- [ ] **Étape 1 : Créer page.tsx**

```tsx
// next-public/app/portal/[code]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PortalView } from './PortalView'
import type { PortalData } from './PortalView'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('projects_v2')
    .select('name, client_name')
    .eq('portal_short_code', code)
    .eq('portal_enabled', true)
    .single()
  return {
    title: `Suivi projet — ${data?.client_name ?? data?.name ?? 'Propulseo'}`,
    robots: 'noindex, nofollow',
  }
}

export default async function PortalPage({ params }: Props) {
  const { code } = await params
  const supabase = createSupabaseServer()
  const now = new Date().toISOString()

  // 1. Projet (vérifie short_code + enabled + non expiré)
  const { data: project } = await supabase
    .from('projects_v2')
    .select('id, name, client_name, client_id, status, progress, completion_score, next_action_label, next_action_due, presta_type, start_date, end_date, budget, ai_summary, portal_expires_at')
    .eq('portal_short_code', code)
    .eq('portal_enabled', true)
    .or(`portal_expires_at.is.null,portal_expires_at.gt.${now}`)
    .single()

  if (!project) notFound()

  // 2. Checklist (tâches racines seulement)
  const { data: checklist } = await supabase
    .from('checklist_items_v2')
    .select('id, title, phase, status')
    .eq('project_id', project.id)
    .is('parent_task_id', null)
    .order('sort_order', { ascending: true })

  // 3. Factures (envoyées, payées, en retard)
  const { data: invoices } = await supabase
    .from('project_invoices_v2')
    .select('id, label, amount, status, date, due_date')
    .eq('project_id', project.id)
    .in('status', ['sent', 'paid', 'overdue'])
    .order('date', { ascending: false })

  // 4. Contact client
  let contact = null
  if (project.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, email, phone, address, sector')
      .eq('id', project.client_id)
      .single()
    if (clientData) contact = clientData
  }

  const portalData: PortalData = {
    project,
    checklist: checklist ?? [],
    invoices: invoices ?? [],
    contact,
  }

  return <PortalView data={portalData} />
}
```

- [ ] **Étape 2 : Créer PortalView.tsx (Client Component)**

```tsx
// next-public/app/portal/[code]/PortalView.tsx
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, Euro, User, Briefcase } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Logo } from '@/components/Logo'
import { GlassCard } from '@/components/GlassCard'
import { formatDate } from '@/lib/utils'

export interface PortalData {
  project: {
    id: string; name: string; client_name: string | null; client_id: string | null
    status: string | null; progress: number | null; completion_score: number | null
    next_action_label: string | null; next_action_due: string | null
    presta_type: string | null; start_date: string | null; end_date: string | null
    budget: number | null; ai_summary: string | null; portal_expires_at: string | null
  }
  checklist: { id: string; title: string; phase: string | null; status: string }[]
  invoices: { id: string; label: string; amount: number; status: string; date: string | null; due_date: string | null }[]
  contact: { name: string | null; email: string | null; phone: string | null; address: string | null; sector: string | null } | null
}

const INVOICE_BADGE: Record<string, { label: string; color: string }> = {
  sent:    { label: 'Envoyée',   color: '#93c5fd' },
  paid:    { label: 'Payée',     color: '#6ee7b7' },
  overdue: { label: 'En retard', color: '#fca5a5' },
  draft:   { label: 'Brouillon', color: 'rgba(255,255,255,0.3)' },
}

export function PortalView({ data }: { data: PortalData }) {
  const { project, checklist, invoices, contact } = data
  const progress = project.progress ?? 0

  return (
    <PageShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Logo size={48} />
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>{project.name}</h1>
          {project.client_name && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{project.client_name}</p>}
        </motion.div>

        {/* Progression */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard style={{ padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Avancement global</span>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', borderRadius: 3 }}
              />
            </div>
            {project.next_action_label && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                <Clock size={12} />
                <span>Prochaine étape : {project.next_action_label}</span>
                {project.next_action_due && <span>· {formatDate(project.next_action_due)}</span>}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard style={{ padding: '20px 24px', marginBottom: 16 }}>
              <h2 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={12} />Étapes du projet
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checklist.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.status === 'done'
                      ? <CheckCircle2 size={14} style={{ color: '#6ee7b7', flexShrink: 0 }} />
                      : item.status === 'blocked'
                      ? <AlertCircle size={14} style={{ color: '#fca5a5', flexShrink: 0 }} />
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 13, color: item.status === 'done' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>
                      {item.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Factures */}
        {invoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard style={{ padding: '20px 24px', marginBottom: 16 }}>
              <h2 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Euro size={12} />Facturation
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invoices.map(inv => {
                  const badge = INVOICE_BADGE[inv.status] ?? INVOICE_BADGE.draft
                  return (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{inv.label}</p>
                        {inv.date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(inv.date)}</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{inv.amount.toLocaleString('fr-FR')} €</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: badge.color, background: `${badge.color}18`, padding: '2px 8px', borderRadius: 20 }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Contact */}
        {contact && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard style={{ padding: '20px 24px' }}>
              <h2 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} />Votre contact
              </h2>
              {contact.name && <p style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{contact.name}</p>}
              {contact.email && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{contact.email}</p>}
              {contact.phone && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{contact.phone}</p>}
            </GlassCard>
          </motion.div>
        )}

      </div>
    </PageShell>
  )
}
```

- [ ] **Étape 3 : Commit**

```bash
git add next-public/app/portal/
git commit -m "feat(next-public): page /portal/[code] — portail client SSR"
```

---

### Task 10: Build, test dev, et Vercel setup

- [ ] **Étape 1 : Build de vérification**

```bash
cd next-public && npm run build
```

Attendu : `✓ Compiled successfully` sans erreur TypeScript. Si erreurs, les corriger avant de continuer.

- [ ] **Étape 2 : Test en dev**

```bash
npm run dev
```

Vérifier dans le navigateur :
- `http://localhost:3001/brief-invite/INVALID` → page 404 "Lien invalide ou expiré"
- `http://localhost:3001/brief/INVALID` → page 404
- `http://localhost:3001/portal/INVALID` → page 404
- `http://localhost:3001/` → redirect vers propulseo.fr

- [ ] **Étape 3 : Créer le projet Vercel**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main/next-public
npx vercel link
```

Choisir :
- Team : `crm-v2s-projects`
- New project : `propulseo-public`
- Root directory : `next-public` (déjà dans le bon dossier)

- [ ] **Étape 4 : Ajouter les variables d'environnement**

```bash
npx vercel env add SUPABASE_URL production
# → https://wftozvnvstxzvfplveyz.supabase.co

npx vercel env add SUPABASE_ANON_KEY production
# → [copier depuis le dashboard Supabase → Settings → API → anon public]
```

- [ ] **Étape 5 : Déployer en production**

```bash
npx vercel --prod
```

Attendu : URL `propulseo-public.vercel.app` — noter l'URL.

- [ ] **Étape 6 : Configurer le domaine suivi.propulseo.fr**

Dans le dashboard Vercel (projet `propulseo-public` → Settings → Domains) :
1. Ajouter `suivi.propulseo.fr`
2. Vercel affiche l'enregistrement DNS — ajouter chez le registrar :
   ```
   CNAME  suivi  cname.vercel-dns.com
   ```
3. Attendre propagation DNS (5-30 min), vérifier dans Vercel que le domaine est actif.

- [ ] **Étape 7 : Commit final**

```bash
cd .. && git add next-public/
git commit -m "feat(next-public): build OK + Vercel setup"
```

---

### Task 11: Mettre à jour les liens dans le CRM Vite

- [ ] **Étape 1 : Trouver les composants qui affichent les liens**

```bash
grep -rn "portal_token\|brief_token\|/portal/\|/brief/\|/brief-invite/" \
  /Users/trikilyes/Desktop/Privé/CRMPropulseo-main/src --include="*.tsx" --include="*.ts"
```

- [ ] **Étape 2 : Remplacer les URLs de partage**

Pour chaque occurrence qui construit un lien à partager, remplacer :

```ts
// Avant (liens CRM Vite, sur le même domaine)
`${window.location.origin}/portal/${token}`
`${window.location.origin}/brief/${token}`
`${window.location.origin}/brief-invite/${token}`

// Après (liens next-public sur suivi.propulseo.fr)
`https://suivi.propulseo.fr/portal/${shortCode}`
`https://suivi.propulseo.fr/brief/${shortCode}`
`https://suivi.propulseo.fr/brief-invite/${shortCode}`
```

Note : les fonctions `generateToken`, `enableBriefToken` et la création d'invitation retournent maintenant le `shortCode` (Task 3). S'assurer que les appelants utilisent cette valeur de retour pour le lien.

- [ ] **Étape 3 : Vérifier que le CRM build toujours**

```bash
cd /Users/trikilyes/Desktop/Privé/CRMPropulseo-main && npm run build
```

Attendu : build sans erreur.

- [ ] **Étape 4 : Commit final**

```bash
git add -A
git commit -m "feat(crm): liens partagés → suivi.propulseo.fr + build vérifié"
```

---

## Résumé des fichiers créés / modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260412_short_codes.sql` | Create |
| `supabase/functions/create-project-from-brief/index.ts` | Modify |
| `src/lib/shortCode.ts` | Create |
| `src/modules/ClientPortal/useClientPortal.ts` | Modify |
| `src/modules/ProjectsManagerV2/hooks/useBriefV2.ts` | Modify |
| `src/` composant création invitation | Modify (à trouver via grep) |
| `next-public/package.json` | Create |
| `next-public/next.config.ts` | Create |
| `next-public/tailwind.config.ts` | Create |
| `next-public/postcss.config.js` | Create |
| `next-public/tsconfig.json` | Create |
| `next-public/jest.config.ts` | Create |
| `next-public/.env.example` | Create |
| `next-public/.gitignore` | Create |
| `next-public/lib/utils.ts` | Create |
| `next-public/lib/supabase-server.ts` | Create |
| `next-public/__tests__/utils.test.ts` | Create |
| `next-public/components/Orb.tsx` | Create |
| `next-public/components/Logo.tsx` | Create |
| `next-public/components/PageShell.tsx` | Create |
| `next-public/components/GlassCard.tsx` | Create |
| `next-public/app/globals.css` | Create |
| `next-public/app/layout.tsx` | Create |
| `next-public/app/not-found.tsx` | Create |
| `next-public/app/page.tsx` | Create |
| `next-public/app/brief-invite/[code]/page.tsx` | Create |
| `next-public/app/brief-invite/[code]/actions.ts` | Create |
| `next-public/app/brief-invite/[code]/BriefInviteForm.tsx` | Create |
| `next-public/app/brief/[code]/page.tsx` | Create |
| `next-public/app/brief/[code]/actions.ts` | Create |
| `next-public/app/brief/[code]/BriefForm.tsx` | Create |
| `next-public/app/portal/[code]/page.tsx` | Create |
| `next-public/app/portal/[code]/PortalView.tsx` | Create |
