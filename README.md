# Xenith Capital Operations Portal

Internal CRM and Introducer Management Platform for Xenith Capital (SRL Partners Ltd).

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + PostgreSQL + Row Level Security + Storage)
- **Tailwind CSS** + shadcn/ui
- **Resend** for transactional email
- **pdf-lib** for PDF agreement generation
- **Vercel** for deployment + Cron Jobs

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `NEXT_PUBLIC_APP_URL` | Full URL of the portal (e.g. `https://portal.xenithcapital.co.uk`) |
| `CRON_SECRET` | Random secret to secure the cron endpoint (generate with `openssl rand -hex 32`) |

### 3. Database Setup

Run migrations in order via the **Supabase SQL Editor** (Dashboard → SQL Editor):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
```

Optionally review `003_seed_data.sql` for dev data setup.

### 4. Create the First Admin User

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Add User** → **Create New User**
3. Set email/password
4. Add **User Metadata**:
   ```json
   { "role": "admin", "full_name": "Your Name" }
   ```
5. The `handle_new_user` trigger will auto-create a profile row.
6. If the trigger doesn't set admin role, run in SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

### 5. Configure Supabase Storage

The migration creates the `introducer-agreements` bucket automatically. Verify it exists in **Storage → Buckets** and confirm it is **private** (not public).

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` — you will be redirected to `/login`.

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel project settings
4. The `vercel.json` configures the cooling-off cron job automatically

### Cron Job Security

The `/api/cron/cooling-off` endpoint is protected by `CRON_SECRET`. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` if you set the env var. For manual testing:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/cooling-off
```

---

## Cooling-Off Automation

The Vercel Cron (`vercel.json`) runs `/api/cron/cooling-off` every **15 minutes**.

The endpoint:
1. Queries `prospects` where `status = 'cooling_off'` AND `cooling_off_completed_at <= now()`
2. Updates status to `cooling_off_complete`
3. Writes `prospect_status_history` and `audit_log` entries
4. Sends email to the introducer (Resend)
5. Sends notification to `info@xenithcapital.co.uk`

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access to all data, can invite introducers, update all statuses |
| `introducer` | Own data only — must complete onboarding (sign agreement) before accessing portal |

### How to Create an Introducer

Admins use the **Invite Introducer** button (sidebar or `/admin/introducers/invite`). This:
1. Calls `supabase.auth.admin.inviteUserByEmail()` with role metadata
2. Sends a branded welcome email via Resend
3. On first login, the introducer is gated to `/onboarding` until agreement is signed

---

## Agreement Versioning

The current agreement version is `V2_March_2026`. The agreement text is embedded in:
- `app/onboarding/onboarding-wizard.tsx` (rendered in browser)
- `lib/pdf/generate-agreement.ts` (used for PDF generation)

To update the agreement version, update both files and the `agreement_version` default in the `agreements` table migration.

---

## Project Structure

```
/app
  /(auth)/login          — Login page
  /onboarding            — Introducer onboarding wizard (3-step)
  /unauthorised          — Role mismatch error page
  /admin/                — Admin-only routes (all require role=admin)
    dashboard/
    introducers/
    prospects/
    investors/
    tickets/
    settings/
  /portal/               — Introducer routes (require role=introducer + agreement_signed)
    dashboard/
    prospects/
    investors/
    earnings/
    agreement/
    tickets/
  /api/                  — API routes
    agreements/sign/
    introducers/invite/
    prospects/register/
    admin/prospects/[id]/status/
    admin/investors/
    admin/agreements/[id]/download/
    tickets/
    cron/cooling-off/
/components
  layout/                — Sidebar, AppLayout, PageHeader
  prospects/             — CoolingOffCountdown
  investors/             — VestingTracker
  ui/                    — DataTable, StatCard
  status-badge.tsx       — All status badge components
/lib
  supabase/              — Client, server, middleware helpers
  email/                 — Resend client + HTML templates
  pdf/                   — pdf-lib agreement generation
  utils.ts               — Formatting, calculations
/supabase
  migrations/            — Numbered SQL migration files
/types
  database.ts            — TypeScript types for all tables
```

---

## Email Sender Configuration

All emails are sent from `noreply@xenithcapital.co.uk` with reply-to `info@xenithcapital.co.uk`.

To use custom domain sending in Resend:
1. Go to Resend Dashboard → Domains
2. Add `xenithcapital.co.uk`
3. Configure the required DNS records

---

## Security Notes

- All routes are protected by middleware (`middleware.ts`)
- Row Level Security (RLS) enforced at database level (`002_rls_policies.sql`)
- Service role key is never exposed to the browser
- PDF agreements are stored in a private Supabase storage bucket
- Admin downloads are served via short-lived signed URLs (60 seconds)
- IP addresses are captured server-side at signing time

---

## Support

For platform issues, contact the development team. For business queries: info@xenithcapital.co.uk
