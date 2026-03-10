# Job Tracker Slice 3 Verification Checklist

Use this checklist to validate Slice 3 improvements for daily tracker usability.

## Build and Type Safety
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.

## Application List Filters and Sorting
- [ ] Status filter supports: all, wishlist, applied, interview, offer, accepted, rejected.
- [ ] Search matches company name.
- [ ] Search matches role title.
- [ ] Search also matches location (when provided).
- [ ] Sort supports newest updated.
- [ ] Sort supports oldest updated.
- [ ] Sort supports applied date descending.
- [ ] Sort supports applied date ascending.
- [ ] Sort supports company name A–Z.

## Empty State Behavior
- [ ] With zero data, app shows first-application empty state.
- [ ] With data but no filter matches, app shows filter-aware no-results state.
- [ ] No-results state provides a reset filters action.

## Card Usability and Readability
- [ ] Status badge remains easy to scan.
- [ ] Applied date is clearly visible.
- [ ] Metadata grouping is cleaner (status/location/job URL/notes).
- [ ] Job URL treatment appears intentional.
- [ ] Notes are visually lighter and do not dominate cards.

## Existing CRUD + Quick Status Flows (No Drawer Redesign)
- [ ] Create application works.
- [ ] Edit application works.
- [ ] Delete application works.
- [ ] Quick status update works from list cards.

## Summary Consistency
- [ ] Top summary cards remain global snapshot values.
- [ ] Pipeline snapshot remains global snapshot values.
- [ ] Filtering only affects list content below summary blocks.

## Responsive UX
- [ ] Desktop filter bar/layout remains clean and readable.
- [ ] Mobile layout does not break.
- [ ] Filter bar stacks comfortably on small screens.
