# Job Tracker V1 Slice 1 Verification Checklist

## Build & Type Safety
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

## Core User Flow
- [ ] Create application flow works from drawer
- [ ] Applications list renders existing records
- [ ] Edit application flow works from drawer
- [ ] Delete application flow removes record
- [ ] Status update works (inline select)
- [ ] Empty state displays when no records exist

## UX Contract
- [ ] Drawer validation errors appear in footer notice area
- [ ] Drawer actions prevent double-submit while loading
- [ ] Drawer layout is mobile scroll-safe

## Dashboard Summary Baseline
- [ ] Summary payload returns `totalApplications`
- [ ] Summary payload returns status counts for `applied`, `interview`, `offer`

## Governance
- [ ] `AGENTS.md` task log updated newest-first
- [ ] Parent registry intent recorded (planning only; no write in Slice 1)
