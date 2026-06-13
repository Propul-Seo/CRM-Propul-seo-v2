# PRD — PROPUL'SPACE (Unified Premium Client Portal) for CRM Propul'SEO v2

> **Status**: v3 — full rewrite with unified parcours (Phase 0 → Phase 7)
> **Date**: May 2026
> **Author**: Lyes Triki (Propul'SEO)
> **Target repo**: [CRM-Propul-seo-v2](https://github.com/Propul-Seo/CRM-Propul-seo-v2)
> **Target module**: `src/modules/EspaceClient/` (to be created)
> **Format**: aligned with Etienne's feature PRDs in the `propulseo-vibe-dev` library
> **Validation**: to be presented to Etienne for sign-off

---

## 1. VIBE & GOAL

**Vibe**: Premium unified workspace — Stripe Dashboard meets Linear meets shared Notion — branded Propul'SEO. Calm and professional, mobile-first, light interface (off-white background, violet accents). Two distinct experiences in one product: the **acquisition tunnel** (qualification questionnaire → discovery → contracting → payment) and the **operational portal** (project tracking, documents, invoices, signatures). Every prospect who fills the qualification questionnaire ends up with an account in Propul'Space. From there, the journey through 8 phases is balisé, visible, never restarts: information given in Phase 0 is never asked again in Phase 6.

**Goal**: Build a single product that handles the complete client lifecycle — from anonymous prospect on propulseo-site.com to active client receiving deliverables — while (1) demonstrating the value of work performed in real-time to justify the premium price, (2) industrializing the commercial process (today entirely manual: invoicing, follow-ups, document tracking), and (3) creating a differentiating premium experience that increases retention. 12-month target: 20-30 portal-active clients, weekly usage > 60%, 70% reduction in "where is my project" emails, 100% of premium contracts signed via DocuSeal, 100% of deposits paid via Stripe in less than 7 days. The module lives **inside the existing CRM Propul'SEO v2**, sharing the same Supabase database but exposing two interfaces: the admin CRM (Lyes + Etienne) and the client portal (prospects → clients).

---

## 2. USER STORIES

### Phase 0 — Qualification (prospect side)

- **As a prospect** visiting propulseo-site.com, I want to start my project request in less than 10 minutes from any device, so I don't have to schedule a call before I even know if we're a match.
- **As a prospect**, I want to upload my logo or current site captures during the qualification, so Propul'SEO can prepare a more precise proposal.
- **As a prospect**, I want clear visibility on how long the form will take and where I am in the process, so I'm not surprised.
- **As a prospect**, I want my answers to be saved automatically, so I can come back later without losing my progress.
- **As a prospect**, I want to book a 30-minute call directly at the end if I'm convinced, so I don't have to wait 48h for someone to contact me back.
- **As a prospect**, I want to be confident my phone number won't be misused, so I trust the form enough to fill it.

### Phase 0 — Qualification (admin side)

- **As Lyes/Etienne**, I want to receive a notification with full qualification details the moment a lead submits, so I can call them within the optimal window.
- **As Lyes/Etienne**, I want the lead's company info to be pre-enriched (SIRET via Pappers API, social presence), so I prepare the call efficiently.
- **As Lyes/Etienne**, I want filtered/sorted lead view in CRM by quality score (budget × intent × sector fit), so I prioritize my outreach.
- **As Lyes/Etienne**, I want a deduplication check (same email/phone within 30 days), so I don't multi-contact a single prospect.

### Phases 1-4 — Discovery to Contract (prospect → client)

- **As a prospect now in discussions**, I want a clear status indicator in my Propul'Space showing where I stand (proposal sent, contract pending, etc.), so I'm not anxious.
- **As Marc the demanding executive**, I want to sign quotes and contracts in 2 clicks from my mobile, so I don't waste 20 minutes on print-scan-resend cycles.
- **As Lyes/Etienne**, I want to generate a quote from the qualification data without re-typing, so I save 30 minutes per quote.
- **As Lyes/Etienne**, I want to be alerted if a quote/contract stays unsigned for more than 7 days, so I can follow up.

### Phase 5 — Deposit Payment

- **As Marc**, I want to pay the deposit in 1 click via Stripe with my CB or virement, so it's frictionless.
- **As Marc**, I want immediate confirmation that my payment was received, so I know the project can start.
- **As Lyes/Etienne**, I want the project to be auto-created and the portal to switch to "active" mode the moment the deposit clears, so I don't waste time on manual switching.

### Phase 6 — Onboarding

- **As Marc**, I want the onboarding form to be pre-filled with what I already shared during qualification, so I don't repeat myself.
- **As Marc**, I want to upload documents (charter, logos, content, access credentials) into a structured workspace organized by category, so my project starts clean.
- **As Marc**, I want a guided tutorial on how to use Propul'Space, so I'm not left wondering.
- **As Marc's accountant**, I want to download all invoices in CSV/XLSX, so I can integrate them into our accounting software.
- **As Lyes/Etienne**, I want to see the onboarding progress in real-time (which questions answered, which documents uploaded), so I can chase blockers proactively.

### Phase 7 — Active Project

- **As Marc**, I want to see at a glance where my project stands, the next action required, the latest deliverable received.
- **As Marc**, I want to download all my documents from one place, sorted by category and date.
- **As Marc**, I want to pay invoices via a 1-click Stripe link, so I never have to handle wire transfers manually.
- **As Marc**, I want to be notified only when MY action is required, so I'm not flooded with useless notifications.
- **As Marc**, I want to see history of project steps and work performed, so I have concrete proof of what I'm paying for.
- **As Marc**, I want to contact Propul'SEO in 1 click (WhatsApp or email), so I don't have to search for their contact.
- **As Marc**, I want to receive email notifications for important events (invoice, signature), so I don't miss critical actions.
- **As Lyes/Etienne**, I want to see all active portal clients with pending actions in one view, so I run the agency efficiently.
- **As Lyes/Etienne**, I want to create and send an invoice in 5 minutes with Stripe payment link, so I stop manual invoicing.
- **As Lyes/Etienne**, I want to deactivate a client portal cleanly when subscription ends, with GDPR-compliant data retention, so I stay legal.

---

## 3. TECH SPECS

### 3.1 Design System — Propul'Space

The visual language is intentionally **distinct from propulseo-site.com**. The website is bold and dark (acquisition-focused, short visits). Propul'Space is calm and clear (operational tool, long sessions). Both share the Propul'SEO violet as signature.

#### Color tokens

```css
/* Light theme (default) */
--background: #FAFAFA;
--background-elevated: #FFFFFF;
--background-subtle: #F4F4F5;

--text-primary: #18181B;
--text-secondary: #52525B;
--text-muted: #A1A1AA;

/* Propul'SEO violet — signature, accent only */
--primary: #7C3AED;
--primary-hover: #6D28D9;
--primary-subtle: #EDE9FE;
--primary-text: #5B21B6;

/* Semantic */
--success: #16A34A; --success-subtle: #DCFCE7;
--warning: #EA580C; --warning-subtle: #FFEDD5;
--danger: #DC2626;  --danger-subtle: #FEE2E2;
--info: #2563EB;    --info-subtle: #DBEAFE;

/* Borders & shadows */
--border-default: #E4E4E7;
--border-strong: #D4D4D8;
--shadow-card: 0 1px 3px rgba(0,0,0,0.05);
--shadow-floating: 0 10px 25px rgba(124, 58, 237, 0.08);
```

#### Typography

- **Font**: Inter (Google Fonts)
- **Numbers**: Inter with `tabular-nums`

Scale:
- Display: 32/40px, weight 600
- H1: 24/32px, weight 600
- H2: 18/28px, weight 600
- Body: 15/24px, weight 400 (denser than 16px default)
- Small: 13/20px, weight 400
- Tiny: 12/16px, weight 500

#### Component principles

- Generous radius: 8px inputs, 12px cards, 16px modals
- Subtle transitions: 200ms, never > 300ms
- Whitespace generous
- Icons: Lucide exclusively
- Mobile-first (375px baseline)

### 3.2 shadcn/ui components used

Reuses from `src/components/ui/`: Card, Tabs, Badge, Button, Dialog, Sheet, Table, Skeleton, Toast (sonner), Avatar, Progress, Tooltip, AlertDialog, Form (react-hook-form + zod), RadioGroup, Checkbox, custom Stepper.

### 3.3 Supabase DB Schema

#### Existing tables to extend

```sql
-- Migration: 2026MMDD_propulspace_init.sql

-- users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_linked_client_id UUID REFERENCES clients(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_activated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_deactivated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_deactivation_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portal_phase TEXT
  CHECK (portal_phase IN (
    'qualification', 'discovery', 'proposal_sent', 'proposal_signed',
    'contract_signed', 'deposit_paid', 'onboarding', 'active_project',
    'completed', 'churned'
  ));

-- clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_url_slug TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_brand_logo_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_brand_primary_color TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0
  CHECK (quality_score BETWEEN 0 AND 100);

-- projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_visible BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_next_milestone_label TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_next_milestone_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_published_hours_worked NUMERIC(10,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_progress_percent INTEGER DEFAULT 0
  CHECK (portal_progress_percent BETWEEN 0 AND 100);
```

#### Phase 0 — Qualification tables

```sql
CREATE TABLE portal_qualification_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  business_sector TEXT NOT NULL,
  business_sector_custom TEXT,
  has_existing_site BOOLEAN,
  existing_site_url TEXT,
  monthly_traffic TEXT,
  main_problems TEXT[],
  has_domain_only BOOLEAN,
  main_goal TEXT,
  target_audience TEXT,
  competitors TEXT,
  desired_features TEXT[],
  ecommerce_platform TEXT,
  product_count_range TEXT,
  monthly_orders_range TEXT,
  reservation_type TEXT,
  health_specific_needs TEXT,
  has_visual_identity TEXT,
  wants_identity_creation BOOLEAN,
  budget_range TEXT NOT NULL,
  desired_timeline TEXT,
  timeline_reason TEXT,
  is_decision_maker TEXT,
  preferred_contact_method TEXT,
  final_cta_choice TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'contacted', 'qualified', 'unqualified', 'converted')),
  draft_progress_percent INTEGER DEFAULT 0,
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  ae_assigned UUID REFERENCES users(id),
  source TEXT DEFAULT 'website',
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  ip_address INET, user_agent TEXT,
  pappers_enrichment JSONB,
  submitted_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qualif_status ON portal_qualification_leads(status, submitted_at DESC);
CREATE INDEX idx_qualif_email ON portal_qualification_leads(email);
CREATE INDEX idx_qualif_phone ON portal_qualification_leads(phone);

CREATE TABLE portal_qualification_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qualification_lead_id UUID NOT NULL REFERENCES portal_qualification_leads(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL
    CHECK (upload_type IN ('logo', 'charter', 'site_screenshot', 'other')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  original_filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Phases 4-7 — Portal tables

```sql
CREATE TABLE portal_project_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'in_progress', 'completed', 'blocked')),
  date_start DATE,
  date_planned_end DATE,
  date_actual_end DATE,
  visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL
    CHECK (document_type IN (
      'quote', 'contract', 'invoice', 'deliverable',
      'audit', 'report', 'asset_logo', 'asset_charter',
      'asset_content', 'asset_access', 'legal', 'other'
    )),
  category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES portal_documents(id),
  visible_to_client BOOLEAN DEFAULT true,
  uploaded_by_client BOOLEAN DEFAULT false,
  viewed_by_client_at TIMESTAMPTZ,
  downloaded_by_client_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE SEQUENCE IF NOT EXISTS portal_invoice_number_seq START 1;

CREATE TABLE portal_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  is_deposit BOOLEAN DEFAULT false,
  amount_subtotal NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  amount_vat NUMERIC(10,2) NOT NULL,
  amount_total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  line_items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_payment_link_url TEXT,
  stripe_payment_link_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  pdf_hash_sha256 TEXT,
  internal_notes TEXT,
  client_visible_notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  document_id UUID REFERENCES portal_documents(id) ON DELETE SET NULL,
  signature_type TEXT NOT NULL
    CHECK (signature_type IN ('quote', 'contract', 'addendum', 'other')),
  name TEXT NOT NULL,
  docuseal_submission_id TEXT UNIQUE NOT NULL,
  docuseal_template_id TEXT,
  docuseal_signing_url TEXT,
  docuseal_signed_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed', 'declined', 'expired', 'cancelled')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  signer_ip INET,
  signer_user_agent TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  inherited_from_qualification_id UUID REFERENCES portal_qualification_leads(id),
  detailed_personas JSONB,
  brand_voice_notes TEXT,
  content_strategy TEXT,
  logo_uploaded BOOLEAN DEFAULT false,
  charter_uploaded BOOLEAN DEFAULT false,
  content_uploaded BOOLEAN DEFAULT false,
  legal_mentions_provided BOOLEAN DEFAULT false,
  has_provided_google_access BOOLEAN DEFAULT false,
  has_provided_hosting_access BOOLEAN DEFAULT false,
  has_provided_dns_access BOOLEAN DEFAULT false,
  has_provided_social_access BOOLEAN DEFAULT false,
  access_credentials_vault_id TEXT,
  completion_percent INTEGER DEFAULT 0
    CHECK (completion_percent BETWEEN 0 AND 100),
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  kickoff_call_scheduled_at TIMESTAMPTZ,
  kickoff_call_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_docuseal_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docuseal_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL,
  diff JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES users(id),
  qualification_lead_id UUID REFERENCES portal_qualification_leads(id),
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Row Level Security

```sql
-- Qualification leads
ALTER TABLE portal_qualification_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qualif_lead_owner_read" ON portal_qualification_leads FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "qualif_lead_admin_full" ON portal_qualification_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'sales'))
);

-- Documents
ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_docs_client_read" ON portal_documents FOR SELECT USING (
  client_id IN (
    SELECT portal_linked_client_id FROM users
    WHERE auth_user_id = auth.uid() AND portal_enabled = true
  )
  AND visible_to_client = true
  AND deleted_at IS NULL
);
CREATE POLICY "portal_docs_admin_full" ON portal_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Audit log (admin read only, system write via SECURITY DEFINER)
ALTER TABLE portal_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_audit_admin_read" ON portal_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
);
```

### 3.4 Supabase Edge Functions

| Function | Purpose | Trigger |
|---|---|---|
| `portal-submit-qualification` | Receive form, create lead, notify, enrich | Public POST |
| `portal-create-account-from-qualification` | Create users row in `qualification` phase | After submission |
| `portal-deduplicate-lead` | Check email/phone in 30d window | Pre-submit |
| `portal-enrich-lead-pappers` | Pappers MCP enrichment | Async |
| `portal-calculate-quality-score` | Score lead 0-100 | Async |
| `portal-activate-portal` | Activate full portal after contract | DocuSeal webhook |
| `portal-deactivate-portal` | Deactivate, trigger retention | Admin action |
| `portal-create-payment-link` | Stripe Payment Link | Admin action |
| `portal-stripe-webhook` | Stripe webhooks with idempotency | Stripe POST |
| `portal-docuseal-send` | Send for signature | Admin action |
| `portal-docuseal-webhook` | DocuSeal webhooks with idempotency | DocuSeal POST |
| `portal-generate-invoice-pdf` | FR-compliant invoice PDF | After invoice |
| `portal-send-transactional-email` | All transactional emails via Brevo | Multiple |
| `portal-export-invoices` | CSV/XLSX UTF-8 BOM | Admin/client action |
| `portal-daily-cron` | Overdue marking, reminders, expirations | Scheduled 8am UTC |

### 3.5 Conditional logic — Qualification (Phase 0)

```
Rule 1: has_existing_site = false
  HIDE: monthly_traffic, main_problems
  SHOW: has_domain_only

Rule 2: has_existing_site = true
  SHOW: existing_site_url (+ screenshots upload)
  SHOW: monthly_traffic, main_problems

Rule 3: business_sector = 'ecommerce'
  SHOW: ecommerce_platform, product_count_range, monthly_orders_range
  HIDE: vitrine-specific questions

Rule 4: business_sector = 'restaurant_hospitality'
  SHOW: reservation_type, GMB optimization question

Rule 5: business_sector = 'health'
  SHOW: Doctolib/Maiia integration question
  WARNING: GDPR health data specific

Rule 6: business_sector = 'btp_real_estate'
  SHOW: property_type, existing_management_tool

Rule 7: desired_features contains 'ecommerce'
  SHOW: ecommerce-specific deep questions

Rule 8: budget_range = '<2000'
  SOFT WARNING: "Our premium packs start at €5,000"
  ALLOW continue, flag as low-budget

Rule 9: has_visual_identity = 'complete'
  SHOW: optional upload (logo + charter)
  Auto-tag CRM "assets_available"

Rule 10: has_visual_identity = 'logo_only'
  SHOW: logo upload
  SHOW: "Want complete identity creation?"

Rule 11: has_visual_identity = 'none'
  SHOW: "Want identity creation included?"
  Flag "identity_creation_needed"

Rule 12: desired_timeline = 'urgent'
  SHOW: timeline_reason text field

Rule 13: is_decision_maker = 'escalates'
  Flag "escalation_needed" (longer cycle)
```

### 3.6 Quality scoring algorithm

```
Budget score (40 max):
  '<2000'       → 0
  '2000-5000'   → 15
  '5000-10000'  → 25
  '10000-20000' → 35
  '>20000'      → 40

Intent score (30 max):
  is_decision_maker = 'alone'            → 15
  is_decision_maker = 'with_associates'  → 10
  is_decision_maker = 'escalates'        → 5
  final_cta = 'meeting_booked'           → +15
  final_cta = 'diagnostic_only'          → 0

Sector fit (20 max):
  premium target list                    → 20
  neutral                                → 10
  low fit                                → 0

Asset readiness (10 max):
  charter complete + upload              → 10
  logo only + upload                     → 5
  nothing                                → 0

Threshold:
  60+ = priority callback
  30-59 = standard
  <30 = nurture
```

### 3.7 Phase 0 — Questionnaire UI flow (7 steps)

```
STEP 1 — Identity (45 sec)
  Full name *, email *, phone * (required), company, business_sector

STEP 2 — Current situation (1-2 min, conditional)
  Has existing site? Conditional follow-ups

STEP 3 — Goals (1 min)
  Main goal, target audience, competitors

STEP 4 — Desired features (1-2 min, conditional)
  Multi-select with sub-questions

STEP 5 — Visual identity (1 min, with uploads)
  Charter status, optional logo/charter upload

STEP 6 — Budget & timeline (30 sec)
  Budget range, timeline, conditional reason if urgent

STEP 7 — You as interlocutor (1 min + 2 min if meeting)
  Decision maker, contact method
  RECAP of answers
  CTA: "Receive diagnostic by email" OR "Book 30-min meeting" (Cal.com embed)
```

### 3.8 Client portal UI flow (Phase 4+)

```
Login espace.propulseo.fr (Supabase Auth magic link)
  ↓
Dashboard
  - "My project" tile (step + next action + progress %)
  - "Pending actions" tile (to pay/sign/complete)
  - "Latest documents" tile (3 latest)
  - "Contact Propul'SEO" sticky button (mobile)

Tab Project — timeline + current step + hours worked + latest deliverables
Tab Documents — filtered list with download
Tab Invoices — list + Stripe pay button + PDF download
Tab Signatures — list + DocuSeal sign button + signed PDF
Tab Help — contextual FAQ, tutorial replay
```

### 3.9 Admin UI flow (inside existing CRM v2)

```
Existing ProjectsManagerV2 module
  + tab "Propul'Space" on client detail
  + activation/management shortcut

Existing CRM lead pipeline
  + leads from Phase 0 appear here with quality score

New /admin/espace-client
  - Overview all portal clients + KPIs
  - Per-client panel (6 tabs)
  - Urgent actions at top
  - Bulk operations

New /admin/leads-qualifies
  - List Phase 0 leads with quality score
  - Filter by status/score/sector/date
  - Detail view with conditional answers + uploads
  - Quick actions
```

### 3.10 Client onboarding flow (Phase 6, post-contract)

1. Email "Welcome, project starts!" via Brevo
2. Onboarding wizard on first login (skippable, replayable):
   - Tour of 4 main tabs (animated)
   - How to pay invoice
   - How to sign document
   - How to upload documents
3. Onboarding form pre-filled with Phase 0 data
4. Real-time progress shown to admin
5. Kickoff call scheduled (Cal.com)
6. J+7 if incomplete: admin alert + automated reminder
7. J+14: project officially starts

### 3.11 Client deactivation flow

1. Admin clicks "Deactivate" with reason
2. Edge Function sets portal_enabled=false, logs reason, sends farewell email
3. Read-only access for 30 days
4. After 30 days: access revoked, data retained (10y legal)
5. After 3 years: anonymization if GDPR right invoked

### 3.12 Edge cases

- Lead spam/bots: rate limit (5/hour per IP), honeypot, reCAPTCHA v3 fallback
- Duplicate submission: soft error
- Lead never contacted in 48h: auto-alert escalation
- Client never logged in: J+3 and J+7 follow-ups
- Overdue invoice: auto-status D+1, reminders D+7, D+15, D+30
- Expired signature: auto-status, admin notification
- Document > 25 MB: error with compression suggestion
- Stripe/DocuSeal webhook retry: idempotency tables
- Concurrent admin edits: optimistic locking via updated_at
- Client email change: manual admin V1
- GDPR deletion: soft delete + anonymization after retention
- Service outage: graceful degradation, admin alert

### 3.13 External integrations

| Service | Use case | V1 cost | V2 estimate |
|---|---|---|---|
| Stripe | Payment Links + Webhooks | 1.4% + €0.25 per EU CB | Same |
| DocuSeal Cloud | E-signatures | €0 (free tier 10/mo) | €24/mo if exceeded |
| WhatsApp | Pre-filled `wa.me` link | €0 | API Business V2 (~€50/mo) |
| Supabase Storage | Documents + PDFs | Included | Same |
| Supabase Edge Functions | Server logic | Included | Same |
| Supabase Auth | Magic link sessions | Included | Same |
| Brevo | Transactional emails | Included | Same |
| Cal.com | Meeting booking | €0 self-host or €12/user/mo | Same |
| Pappers MCP | Lead enrichment | Included via MCP | Same |

### 3.14 Total Cost of Ownership (12 months, 30 clients)

- Stripe fees: ~€100 fixed + transaction-linked
- DocuSeal Cloud: €0-€24/mo
- Supabase compute: ~€25/mo
- Vercel bandwidth: ~€20/mo
- Brevo emails: ~€15/mo
- Cal.com: €0 self-hosted or €12/mo cloud
- **Total operating**: ~€60-100/mo direct
- **Dev investment**: 45-55 days (~€20-25k internal time)
- **Break-even**: 5 retained premium clients = ROI year 1

---

## 4. ADAPTATION PLACEHOLDERS

- `[CLIENT_LOGO]` — uploaded per client
- `[CLIENT_PRIMARY_COLOR]` — optional accent
- `[CLIENT_URL_SLUG]` — subdomain V3
- `[INVOICE_FORMAT]` — V2
- `[NOTIFICATION_LANGUAGE]` — V2 EN support
- `[ACCOUNTING_EXPORT_FORMAT]` — V2 API direct
- `[BUSINESS_SECTOR_LIST]` — curated for target market
- `[QUESTIONNAIRE_QUESTIONS]` — versioned over time
- `[QUALITY_SCORE_WEIGHTS]` — tunable

---

## 5. ACCEPTANCE CRITERIA

### Performance & UX
- [ ] Lighthouse mobile ≥ 90, desktop ≥ 95 on all pages
- [ ] LCP < 2.5s mobile, INP < 200ms, CLS < 0.1
- [ ] No overflow at 375px, touch targets ≥ 44px
- [ ] Safe area iPhone notch + home bar
- [ ] Skeletons everywhere, no spinners
- [ ] Questionnaire auto-save every 10 sec

### Functionality — Phase 0
- [ ] 7-step questionnaire completable < 10 min mobile
- [ ] All conditional rules work
- [ ] File uploads reach Supabase Storage
- [ ] Phone required, validated
- [ ] Duplicate detection 30d window
- [ ] Auto-account creation in `qualification` phase
- [ ] Quality score within 5 sec post-submit
- [ ] Pappers enrichment async, non-blocking
- [ ] Cal.com integration: meeting booked redirects
- [ ] Email confirmation < 30 sec

### Functionality — Phases 4-7
- [ ] Happy path login → view → pay → sign → download < 90 sec mobile
- [ ] Admin invoice creation in < 5 min
- [ ] Invoice PDF FR anti-fraud compliant
- [ ] Invoice numbering atomic, sequential, no gaps
- [ ] Sent invoices locked
- [ ] Stripe webhook idempotent
- [ ] DocuSeal webhook idempotent
- [ ] CSV export UTF-8 BOM semicolon

### Security & compliance
- [ ] RLS tested, 0 cross-client leakage
- [ ] Audit log on all sensitive CUD
- [ ] Service role key never client-side
- [ ] HTTPS forced, HSTS
- [ ] Magic links < 30 sec
- [ ] Soft delete on sensitive entities
- [ ] Data retention daily cron
- [ ] GDPR access right exportable
- [ ] GDPR forget right anonymization ready
- [ ] Honeypot + rate limit + reCAPTCHA fallback

### Legal pages
- [ ] CGU drafted and reviewed
- [ ] Privacy Policy drafted
- [ ] Mentions Légales drafted
- [ ] Cookie banner CNIL-compliant if tracking used

### Monitoring & analytics
- [ ] Events: qualification_submitted, lead_contacted, lead_converted, login, invoice_paid, document_downloaded, signature_completed
- [ ] Weekly usage rate per client visible
- [ ] Leads pending callback alerts
- [ ] Sentry errors with breadcrumbs
- [ ] Uptime monitoring on portal URL

### Accessibility
- [ ] All strings in messages/fr.json
- [ ] WCAG 2.2 AA contrast
- [ ] Keyboard navigation
- [ ] Semantic HTML + ARIA
- [ ] prefers-reduced-motion respected

---

## 6. TODO IMPLEMENTATION

### Phase 1 — Database & infrastructure (Days 1-4)

1. Migration `2026MMDD_propulspace_init.sql`
2. Rollback `2026MMDD_propulspace_rollback.sql`
3. Apply on staging
4. Generate TS types
5. RLS test suite (Vitest)
6. Validate RLS: 0 leakage
7. Storage bucket `portal-uploads` (signed URLs)
8. Storage bucket `portal-documents` (private)
9. Env vars: Stripe, DocuSeal, Brevo, Cal.com, Pappers (staging)

### Phase 2 — Phase 0 Qualification module (Days 5-12)

10. Questionnaire React form (react-hook-form + zod)
11. Conditional logic engine (13+ rules)
12. File upload handler → Supabase Storage
13. Auto-save (every 10 sec)
14. `portal-submit-qualification` Edge Function
15. `portal-create-account-from-qualification`
16. `portal-deduplicate-lead`
17. `portal-enrich-lead-pappers`
18. `portal-calculate-quality-score`
19. Brevo templates: lead confirmation + admin notification
20. Cal.com integration on Step 7 CTA
21. Honeypot + rate limit + reCAPTCHA fallback
22. Admin module `/admin/leads-qualifies`
23. Playwright E2E tests

### Phase 3 — Edge Functions portal active (Days 13-20)

24. `portal-activate-portal` (DocuSeal contract webhook trigger)
25. `portal-deactivate-portal`
26. `portal-create-payment-link` (Stripe)
27. `portal-stripe-webhook` (idempotent)
28. `portal-docuseal-send`
29. `portal-docuseal-webhook` (idempotent)
30. `portal-generate-invoice-pdf` (React-PDF + FR mentions + hash)
31. `portal-send-transactional-email` (Brevo templates)
32. `portal-export-invoices` (CSV/XLSX UTF-8 BOM)
33. `portal-daily-cron`

### Phase 4 — Admin module CRM (Days 21-28)

34. Create `src/modules/EspaceClient/admin/` structure
35. Tab "Propul'Space" in ProjectsManagerV2
36. Admin dashboard `/admin/espace-client`
37. Per-client admin panel (6 tabs)
38. "Activate Propul'Space" flow with reason
39. "Create invoice" sheet with line items
40. "Upload document" flow with visibility
41. "Send signature" flow with template
42. Admin "Activity" tab from audit log
43. Analytics tab with per-client KPIs

### Phase 5 — Client-facing module (Days 29-38)

44. Create `src/modules/EspaceClient/client/`
45. Separated auth flow (login client distinct)
46. Layout: top header with logo, no sidebar
47. Dashboard 4 tiles
48. Project tab with timeline
49. Documents tab filter + download
50. Invoices tab with Stripe flow
51. Signatures tab with DocuSeal flow
52. First-login wizard (3 steps skippable)
53. Sticky mobile "Contact" button
54. Help tab with FAQ

### Phase 6 — Onboarding form Phase 6 (Days 39-43)

55. Phase 6 onboarding form (extends Phase 0, pre-fills)
56. Access credentials field with vault redirect
57. Kickoff call scheduling (Cal.com)
58. Admin progress tracking
59. Automated reminders if stalled

### Phase 7 — Testing & QA (Days 44-50)

60. E2E Playwright: Phase 0 → Phase 7 journey
61. Multi-tenant leak tests
62. Lighthouse 8 representative URLs
63. Real device testing
64. Stripe sandbox full flow
65. DocuSeal sandbox full flow
66. Email delivery testing
67. Accessibility audit
68. Security audit RLS
69. Load test 30 concurrent + 100 anonymous form submissions
70. Pre-prod validation Etienne + Lyes

### Phase 8 — Pilot launch (Days 51-55)

71. Activate Phase 0 form on propulseo-site.com
72. Activate Propul'Space for first pilot client (Précieuse)
73. 1-hour onboarding call with pilot
74. Daily monitoring first week
75. Mini-survey at D+14
76. Iterate on top 3 issues

---

## 7. CODE SKELETON

### Conditional questionnaire (Phase 0)

```tsx
// src/modules/EspaceClient/qualification/QuestionnaireFlow.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Situation } from './steps/Step2Situation';
import { Step3Goals } from './steps/Step3Goals';
import { Step4Features } from './steps/Step4Features';
import { Step5Visual } from './steps/Step5Visual';
import { Step6Budget } from './steps/Step6Budget';
import { Step7Decision } from './steps/Step7Decision';
import { useAutoSave } from './hooks/useAutoSave';
import { questionnaireSchema, QuestionnaireData } from './schema';

const STEPS = [
  { component: Step1Identity, label: 'Who are you' },
  { component: Step2Situation, label: 'Your current situation' },
  { component: Step3Goals, label: 'Your goals' },
  { component: Step4Features, label: 'Desired features' },
  { component: Step5Visual, label: 'Visual identity' },
  { component: Step6Budget, label: 'Budget & timeline' },
  { component: Step7Decision, label: 'About you' },
];

export function QuestionnaireFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
  });

  useAutoSave(form.watch(), { interval: 10000 });

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepComponent = STEPS[currentStep].component;

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitQuestionnaire(form.getValues());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>≈ 7 minutes</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <StepComponent form={form} />

      <div className="flex justify-between mt-8">
        {currentStep > 0 && (
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
            ← Previous
          </Button>
        )}
        <Button onClick={handleNext} className="ml-auto">
          {currentStep === STEPS.length - 1 ? 'Send my diagnostic' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
```

### Edge Function `portal-submit-qualification`

```ts
// supabase/functions/portal-submit-qualification/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';

const inputSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/),
  company_name: z.string().optional(),
  business_sector: z.string(),
});

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const data = inputSchema.parse(body);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: duplicate } = await supabase
      .from('portal_qualification_leads')
      .select('id')
      .or(`email.eq.${data.email},phone.eq.${data.phone}`)
      .gte('submitted_at', thirtyDaysAgo.toISOString())
      .single();

    if (duplicate) {
      return new Response(JSON.stringify({
        status: 'duplicate',
        message: 'We already have your request, your dedicated contact will reach out shortly.',
      }), { status: 200 });
    }

    const { data: lead, error: insertError } = await supabase
      .from('portal_qualification_leads')
      .insert({
        ...data,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        ip_address: req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await Promise.all([
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-create-account-from-qualification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ lead_id: lead.id }),
      }),
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-enrich-lead-pappers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ lead_id: lead.id }),
      }),
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-calculate-quality-score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ lead_id: lead.id }),
      }),
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ type: 'qualification_confirmation', lead_id: lead.id }),
      }),
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-send-transactional-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ type: 'new_lead_alert', lead_id: lead.id }),
      }),
    ]);

    return new Response(JSON.stringify({
      status: 'success',
      lead_id: lead.id,
      message: 'Your diagnostic has been received. We will contact you within 24h.',
    }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'An error occurred. Please try again or contact us directly.',
    }), { status: 500 });
  }
});
```

### Stripe webhook (idempotent)

```ts
// supabase/functions/portal-stripe-webhook/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: existing } = await supabase
    .from('portal_stripe_webhook_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existing?.processed) {
    return new Response('Already processed', { status: 200 });
  }

  await supabase.from('portal_stripe_webhook_events').upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    processed: false,
  });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        await supabase.from('portal_invoices').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
        }).eq('id', invoiceId);

        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/portal-send-transactional-email`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
          body: JSON.stringify({ type: 'invoice_paid', invoice_id: invoiceId }),
        });

        await supabase.from('portal_audit_log').insert({
          resource_type: 'invoice',
          resource_id: invoiceId,
          action: 'pay',
          diff: { before: { status: 'sent' }, after: { status: 'paid' } },
        });
      }
    }

    await supabase.from('portal_stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    return new Response('OK', { status: 200 });
  } catch (err) {
    await supabase.from('portal_stripe_webhook_events')
      .update({ processing_error: String(err) })
      .eq('stripe_event_id', event.id);
    return new Response('Processing error', { status: 500 });
  }
});
```

### Client invoice list (React)

```tsx
// src/modules/EspaceClient/client/components/ClientInvoiceList.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Invoice = {
  id: string;
  invoice_number: string;
  issue_date: string;
  amount_total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  stripe_payment_link_url: string | null;
  pdf_url: string | null;
};

const statusVariants = {
  sent: { label: 'À payer', variant: 'default' as const },
  paid: { label: 'Payée', variant: 'success' as const },
  overdue: { label: 'En retard', variant: 'destructive' as const },
  cancelled: { label: 'Annulée', variant: 'secondary' as const },
  draft: { label: 'Brouillon', variant: 'outline' as const },
};

export function ClientInvoiceList() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('portal_invoices').select('*')
      .order('issue_date', { ascending: false })
      .then(({ data }) => setInvoices(data ?? []));
  }, [user]);

  if (invoices === null) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (invoices.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Vous n'avez pas encore de factures.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const status = statusVariants[inv.status];
          return (
            <TableRow key={inv.id}>
              <TableCell className="font-mono">{inv.invoice_number}</TableCell>
              <TableCell>{format(new Date(inv.issue_date), 'dd MMM yyyy', { locale: fr })}</TableCell>
              <TableCell className="font-medium">{inv.amount_total.toFixed(2)} €</TableCell>
              <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
              <TableCell>
                {inv.status === 'sent' && inv.stripe_payment_link_url && (
                  <Button asChild size="sm">
                    <a href={inv.stripe_payment_link_url} target="_blank" rel="noopener">
                      <ExternalLink className="size-4 mr-2" /> Payer
                    </a>
                  </Button>
                )}
                {inv.status === 'paid' && inv.pdf_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={inv.pdf_url} target="_blank" rel="noopener">
                      <Download className="size-4 mr-2" /> PDF
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

---

## 8. NOTES SENIOR / GOTCHAS

### ❌ Never

- Never modify a sent invoice (FR anti-fraud law) — use credit note
- Never delete an invoice (10-year retention) — soft delete only
- Never store credit card data — Stripe handles PCI
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side
- Never trust client-provided amounts — recompute server-side
- Never skip RLS testing on new tables
- Never deactivate portal without email notice
- Never auto-process webhook without idempotency
- Never hardcode production URL — use env var
- Never expose phone numbers of leads in client-side responses
- Never send qualification email confirmation before duplicate check
- Never let questionnaire form submit without honeypot validation
- Never share quality_score with clients

### ⚠️ Warning

- Stripe webhook: use raw body, not parsed JSON
- DocuSeal webhook: same raw body requirement
- Invoice numbering year reset: PG function, not app code
- PDF generation in Edge Function: limited Deno libs, use @react-pdf/renderer
- Storage signed URLs: 7-day max expiration
- Brevo template variables: case-sensitive
- Magic link expiration: default 1h, raise if email slow
- Concurrent invoice edits: optimistic locking mandatory
- Mobile Safari iOS < 16: no PWA push, fallback email
- GDPR forget vs retention: anonymize personal, keep invoices
- Pappers MCP async — don't block submission
- Cal.com integration: test redirect before go-live
- Questionnaire auto-save: encrypt drafts at rest if possible
- Quality scoring: tune weights with real data after 50 leads
- reCAPTCHA v3 fallback: only enable after spam detected

### ✅ Best Practice

- Zod schemas at every boundary
- Audit log on every sensitive write (trigger-based, atomic)
- Soft delete with `deleted_at`
- Real-time updates via Supabase channels
- Stripe test mode in dev/staging (separate webhooks, separate keys)
- DocuSeal sandbox for testing
- Daily cron idempotent
- Email templates versioned
- Monitoring: Sentry errors, UptimeRobot availability, custom overdue alerts
- JSDoc on Edge Functions, README per module
- Phase 0 instrumented with detailed analytics (step_started, step_completed, step_abandoned)
- Quality score weights in env vars (tunable without deploy)
- Lead enrichment: cache Pappers responses 30 days
- Cal.com: embedded widget + fallback "open in new tab"

### 🚀 Upgrade 2026/2027

- AI weekly summary email "Here's what we did for you this week" via Claude
- Smart payment reminders: AI determines best time/channel/tone
- AI contract review: client uploads counter-proposal, Claude highlights diffs
- Portal voice assistant
- WhatsApp Business native integration
- DocuSeal self-hosted migration
- Multi-user per client
- White-label option
- Mobile PWA installable
- Public roadmap with upvotes
- AI lead scoring (ML on conversion history)
- Conversational onboarding (AI clarifies ambiguous answers)
- Smart proposal generation from qualification + Pappers
- Dynamic CGU per client

---

## ANNEX A — Commercial pitch

> "Vous payez Propul'SEO en partie pour notre travail, mais surtout pour notre fiabilité. Propul'Space vous donne la preuve. Dès votre première demande sur notre site, votre espace Propul'SEO commence à se construire. Quand on signe ensemble, tout ce que vous avez déjà partagé reste — on ne vous fait jamais répéter. À chaque moment, vous voyez exactement où en est votre projet, ce qu'on a livré, ce qu'on travaille en ce moment. Vos factures, vos contrats, vos signatures, tout est centralisé dans un seul espace dédié, à votre nom. Plus de chasse aux emails, plus de doutes, plus de relances. C'est notre engagement de transparence inclus dans votre pack premium."

Key talking points:
- "Inclus dans votre pack, sans surcoût"
- "Hébergé en France, données protégées RGPD"
- "Accessible depuis votre téléphone en 2 secondes"
- "Vous signez vos contrats en 2 clics"
- "Vous payez vos factures en 1 clic"
- "Vous voyez chaque heure travaillée pour vous"
- "Votre brief de démarrage est prêt avant même qu'on commence"

---

## ANNEX B — Migration plan

### Existing leads (old Typeform)
1. Export Typeform answers to CSV
2. One-time migration script to import
3. Set status based on CRM state
4. Optional outreach to relevant leads

### Existing premium clients
1. Sort by tier and tenure
2. Select top 5-10 pilots
3. Schedule 30-min onboarding each
4. Activate one at a time over 2 weeks
5. Batch activate remaining after pilot stable
6. Maintain dual workflow 1 month
7. Phase out email-only when adoption > 70%

---

## ANNEX C — Decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | Name: Propul'Space | Memorable, on-brand |
| 2 | Module inside CRM v2 | Reuse 70% infrastructure |
| 3 | Stack: Vite + React + Supabase | Pragmatic, matches CRM |
| 4 | ICP: premium clients only | Justifies investment |
| 5 | Model: included in pack | Differentiator |
| 6 | Target: 20-30 clients in 12 months | Realistic |
| 7 | Benefit: justify price via transparency | Direct commercial value |
| 8 | Primary persona: Marc | Aligns with benefit |
| 9 | V1 single user per client | Simplicity |
| 10 | Admin: Lyes + Etienne V1 | Both need access |
| 11 | V1: dashboard + project + docs + invoices + signatures + WhatsApp light | Critical mass |
| 12 | Signatures: DocuSeal Cloud free tier V1 | Cost-effective |
| 13 | WhatsApp: `wa.me` link V1 | Avoid complexity |
| 14 | V3 scope, 5 milestones | De-risk |
| 15 | Audit log mandatory | GDPR + compliance |
| 16 | Soft delete | Recoverability |
| 17 | Idempotency tables Stripe + DocuSeal | Prevent retry corruption |
| 18 | Onboarding flow with reminders | Adoption-critical |
| 19 | Deactivation 30d read-only + 10y retention | GDPR + legal |
| 20 | CSV/XLSX export | Accountant need |
| **21** | **Phase 0 Qualification = first phase of Propul'Space** | **Unified experience** |
| **22** | **7 steps qualification (not 6)** | **Decision-maker, contact pref, RDV** |
| **23** | **Phone REQUIRED Step 1** | **Filters non-premium leads** |
| **24** | **File uploads in Phase 0** | **Streamlines briefing** |
| **25** | **Cal.com integration Step 7** | **Accelerates conversion** |
| **26** | **Quality scoring 0-100** | **Prioritize callbacks** |
| **27** | **Pappers MCP enrichment async** | **Faster qualification** |
| **28** | **Honeypot + rate limit + reCAPTCHA fallback** | **Anti-spam public form** |
| **29** | **Design system distinct from website** | **Calm for daily use** |
| **30** | **8 phases total (0 to 7)** | **Complete lifecycle** |

---

**END OF PRD v3**

Last updated: May 2026 — v3 (unified parcours with Phase 0)
Estimated effort: 45-55 dev days / 6-8 calendar months
