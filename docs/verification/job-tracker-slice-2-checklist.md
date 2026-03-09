# Job Tracker Slice 2 Verification Checklist

## Functional
- [ ] Home screen follows mini-app standard hero + CTA + summary rhythm
- [ ] Home primary CTA opens `/app/job-applications`
- [ ] Home summary cards show correct totals
- [ ] Home pipeline overview shows canonical statuses
- [ ] Empty state guides first application creation when list is empty
- [ ] Canonical statuses available in create/edit and quick status update:
  - [ ] wishlist
  - [ ] applied
  - [ ] interview
  - [ ] offer
  - [ ] rejected
  - [ ] accepted
- [ ] Create application works
- [ ] Edit application works
- [ ] Quick status update works
- [ ] Delete application works
- [ ] Pipeline counts update after status edits

## Technical
- [ ] `npm run typecheck`
- [ ] `npm run build`

## Manual UX
- [ ] Home page visual alignment matches other Ansiversa mini-app patterns
- [ ] Mobile layout is not broken (home + applications)
- [ ] Drawer behavior remains stable
- [ ] Pipeline summary is understandable at a glance

## Governance
- [ ] `AGENTS.md` updated newest-first
- [ ] Final report includes schema-change and deployment status

## Freeze Status
- Final review complete.
- Job Tracker is approved and frozen.
