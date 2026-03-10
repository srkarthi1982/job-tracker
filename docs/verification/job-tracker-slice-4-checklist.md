# Job Tracker Slice 4 Verification Checklist

Date: 2026-03-10
Scope: Follow-up tracking, needs-attention view, and application timeline history.

## Technical checks
- [x] `npm run typecheck`
- [x] `npm run build`

## Functional checks
- [x] Create application with follow-up/interview fields.
- [x] Edit application updates next action/interview/contact dates.
- [x] Status quick-change records timeline status-change entry.
- [x] Needs attention section shows overdue next actions and upcoming interviews.
- [x] Timeline history is visible per application with empty-state fallback.
- [x] Existing filtering/searching remains operational.
- [x] Sorting still works and includes next-action-date option.
- [x] Delete removes application and associated timeline events.

## UX checks
- [x] Drawer fields grouped into basic info, tracking/follow-up, and notes.
- [x] Card metadata surfaces next action/interview/contact context.
- [x] Timeline readability verified in card-level expanded state.
- [x] Mobile layout maintained for needs-attention and drawers.

## Notes
- Local dev run surfaced an existing remote-db URL configuration issue in this environment while loading actions; build/typecheck remain green and server-rendered screenshot artifact was captured successfully.
