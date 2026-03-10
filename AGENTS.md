⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.
This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

# AGENTS.md
## Job Tracker Repo – Session Notes (Codex)

## Current Architecture
- Astro mini-app derived from `app-starter` and aligned to Ansiversa standards.
- Parent auth/session boundary preserved (JWT + middleware pattern).
- User-only Slice 1 scope (no app-specific admin pages).
- Drawer UX pattern used for create/edit flows.

## App Identity
- `appId`: `job-tracker`
- `slug`: `job-tracker`
- `name`: `Job Tracker`

## Parent Registry Intent (Planning Only)
- `appId`: `job-tracker`
- `slug`: `job-tracker`
- `name`: `Job Tracker`
- `description`: "Track job applications from wishlist to offer."
- `launchStatus`: `beta`
- `visibility`: `public`
- `pricingGate`: `free`
- Registry write deferred in Slice 1 (no parent write performed).

## Task Log (Recent)
- 2026-03-10 Slice 5 AI follow-up assistant + insight panel: added application-bound preset AI layer with guardrails and typed outputs (`src/modules/job-applications/aiAssistant.ts`, `src/modules/job-applications/types.ts`), added server action for preset generation using existing application context (`src/actions/jobApplications.ts`, `src/actions/index.ts`), expanded client store for per-application AI panel state/loading/copy/regenerate (`src/modules/job-applications/store.ts`), integrated inline AI Assist panel into application cards with practical preset actions (`src/pages/app/job-applications.astro`) and styling for compact readable output (`src/styles/global.css`), and added Slice 5 verification checklist (`docs/verification/job-tracker-slice-5-checklist.md`). Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-03-10 Slice 4 follow-up system + timeline history: extended `job_applications` schema with planning dates/labels and added `job_application_events` timeline table (`db/tables.ts`, `db/config.ts`), wired action-layer event logging for create/status changes/interview updates/follow-up updates/contact logs/notes (`src/actions/jobApplications.ts`), expanded application/store types and client logic for needs-attention grouping + timeline toggles + next-action sort (`src/modules/job-applications/types.ts`, `src/modules/job-applications/helpers.ts`, `src/modules/job-applications/store.ts`), redesigned `/app/job-applications` cards/drawers to surface follow-up fields and inline history with compact empty states (`src/pages/app/job-applications.astro`, `src/styles/global.css`), and added Slice 4 verification doc (`docs/verification/job-tracker-slice-4-checklist.md`). Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-03-10 Slice 3 tracker usability pass: implemented list-level filtering and sorting on `src/pages/app/job-applications.astro` + `src/modules/job-applications/store.ts` (status filter, search across company/role/location, sort controls for updated/applied/company, reset filters action), introduced filter-aware no-results state while preserving global summary/pipeline snapshot behavior, and refined card readability/metadata grouping with lightweight style polish in `src/styles/global.css`. Added verification doc `docs/verification/job-tracker-slice-3-checklist.md`. Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-03-10 Job Tracker Freeze: Job Tracker is now considered stable and frozen. Completed work includes Slice 1 application CRUD flow, Slice 2 pipeline status model and summary counters, premium home screen alignment with Ansiversa mini-app standard, refined layout rhythm/section spacing, and production deployment verification. Status: Frozen. Future changes only if a new feature slice is explicitly planned.
- 2026-03-10 Premium home refinement pass (Astra feedback follow-up): tightened home-screen hierarchy and rhythm in `src/pages/index.astro` + `src/styles/global.css` by widening layout breathing (`job-home-container`), strengthening left hero dominance (larger title/lead spacing, simplified eyebrow), reducing right-panel flatness (stage row separators, stronger footer stats treatment), increasing metrics strip emphasis (padding/number prominence/min-height), improving section separation for “What makes Job Tracker different,” and compacting recent-applications presentation to avoid empty-looking large blocks. Kept app route pipeline summary behavior intact except wording polish already in place (`closed outcomes`). Verification: `npm run typecheck` ✅ (existing baseline hints only), `npm run build` ✅.
- 2026-03-09 Tiny polish pass (Quiz-style premium home alignment): reshaped `src/pages/index.astro` to match premium mini-app pattern (two-column hero + CTA cluster + pipeline side panel + metrics strip + branded “What makes Job Tracker different” section + polished recent/empty state flow) while keeping Job Tracker-specific content. Applied wording polish in app route (`closed` -> `closed outcomes`) and tightened home recent-card rhythm/badge alignment via `src/styles/global.css`. Verification: `npm run typecheck` ✅ (existing baseline hints only), `npm run build` ✅.
- 2026-03-09 Slice 2 home + pipeline standardization: upgraded `src/pages/index.astro` to mini-app standard home structure (hero + primary CTA + quick summary cards + pipeline overview + recent applications + guided empty state), expanded canonical status contract to include `accepted` in `src/modules/job-applications/types.ts`, added live pipeline counters in app store (`statusCounts`, `activeCount`, `closedCount`) and surfaced summary/pipeline cards in `src/pages/app/job-applications.astro`. Updated dashboard summary contract (`src/dashboard/summary.schema.ts`) to include full status counts plus active/closed totals. Added verification checklist `docs/verification/job-tracker-slice-2-checklist.md`. Verification: `npm run typecheck` ✅ (existing baseline hints only), `npm run build` ✅.
- 2026-03-09 Git hygiene update: added `.env.vercel.production` to repo `.gitignore` so local Vercel env pull files remain untracked by default.
- 2026-03-08 DB separation closure attempt (blocked by Turso billing): completed fallback safety check on `job-analyzer` and confirmed `job_applications=0`, `Faq=0` (no user/test data to preserve). Attempted dedicated DB provisioning via `turso db create job-tracker --group ansiversa-group` but Turso returned organization overdues error, so dedicated DB creation/repoint/migration could not proceed. Registry handoff payload remains ready (`appId=job-tracker`, `slug=job-tracker`, `launchStatus=beta`, `visibility=public`, `pricingGate=free`) once DB ownership is resolved.
- 2026-03-08 Vercel deployment completed for Job Tracker: linked local repo to Vercel project `srilakshmi-tailors-team/job-tracker`, configured production env vars (shared auth/session/webhook + `PUBLIC_ROOT_APP_URL`, temporary DB target `job-analyzer` URL/token), and deployed production successfully (`dpl_FYLeTcx2MKGkPXzWMBT7xa5xT5GZ`, URL `https://job-tracker-e5437e3eo-srilakshmi-tailors-team.vercel.app`, status Ready). Custom subdomain mapping attempt for `job-tracker.ansiversa.com` is pending because Vercel returned domain access 403 under current scope; requires domain ownership/permission fix in Vercel before alias can be attached.
- 2026-03-08 Remote DB fallback migration applied for Slice 1: temporarily targeted existing Turso database `job-analyzer` (`libsql://job-analyzer-ansiversa.aws-ap-south-1.turso.io`) as requested because new `job-tracker` DB creation was blocked by organization billing overdues. `astro db push --remote --force-reset` executed after verifying legacy tables (`JobPosts`, `JobSkills`) were empty; resulting schema now includes `job_applications`, `Faq`, `_astro_db_snapshot`. This is an interim infrastructure fallback and should be replaced by a dedicated `job-tracker` DB once billing allows creation.
- 2026-03-08 Verification checklist created: added `docs/verification/job-tracker-slice-1-checklist.md` with build/typecheck, CRUD flow, status update, empty state, drawer mobile behavior, dashboard summary checks, and governance checks.
- 2026-03-08 Dashboard summary baseline added: implemented `src/dashboard/summary.schema.ts` with `JobTrackerDashboardSummaryV1` contract and status counts (`applied`, `interview`, `offer`) + total applications; wired activity push helper `src/lib/pushActivity.ts` for parent dashboard webhook payload preparation.
- 2026-03-08 Core user flow implemented: added job applications actions/store/routes for create/list/edit/status update/delete using drawer UX (`src/actions/jobApplications.ts`, `src/modules/job-applications/store.ts`, `src/pages/app/job-applications.astro`), including predictable error handling and loading/double-submit guards.
- 2026-03-08 DB/data model created: replaced starter example table with `job_applications` in `db/tables.ts` + `db/config.ts` with required Slice 1 fields (`id`, `userId`, `companyName`, `roleTitle`, `status`, `appliedDate`, optional `jobUrl/location/notes`, `createdAt`, `updatedAt`) and constrained status contract (`wishlist`, `applied`, `interview`, `offer`, `rejected`).
- 2026-03-08 Repo bootstrap from app-starter baseline: scaffolded `job-tracker` from `app-starter`, removed example-items/admin/bookmarks scaffolding, switched app identity to `job-tracker`, created app route baseline (`/app/job-applications`), and preserved shared auth/layout patterns.

## Deferred to Slice 2
- Parent registry write execution in `web` admin/registry flows.
- Optional dedicated details/editor route beyond list + drawer flow.
- Additional analytics or notification events beyond baseline activity summary push.
