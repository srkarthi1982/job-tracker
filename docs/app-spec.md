# App Spec: job-tracker

## 1) App Overview
- **App Name:** Job Tracker
- **Category:** Career / Productivity
- **Version:** V1
- **App Type:** DB-backed
- **Purpose:** Help an authenticated user track job applications from wishlist through accepted or rejected outcomes, with timeline history and follow-up tracking.
- **Primary User:** A single signed-in job seeker.

## 2) User Stories
- As a user, I want to create and edit job application entries, so that I can manage my pipeline in one place.
- As a user, I want to update status, follow-up dates, interview dates, and notes, so that I can keep momentum across active applications.
- As a user, I want an event timeline for each application, so that I can review what changed and when.

## 3) Core Workflow
1. User signs in and opens `/app/job-applications`.
2. User creates an application with company, role, stage, and optional context such as link, location, and notes.
3. User updates the application over time as it moves through wishlist, applied, interview, offer, accepted, or rejected states.
4. The app records timeline events for important changes and surfaces summary metrics plus recent applications.
5. User continues managing follow-ups and outcomes from the same authenticated list/detail workflow.

## 4) Functional Behavior
- Job Tracker persists job applications and timeline events in Astro DB per authenticated user.
- The app uses a drawer-based CRUD flow on `/app/job-applications` rather than a separate multi-screen wizard.
- Status, next-action, interview, contact, and note changes produce timeline history so progress is inspectable later.
- Current implementation includes dashboard summary push and parent integration hooks, but application data remains owned by this repo.
- Landing content is public; the actual tracker workflow is protected by the parent auth session.
- Current implementation appears to include helper intelligence/match-assistant support in code, but the core V1 contract remains truthful application tracking rather than autonomous AI action.

## 5) Data & Storage
- **Storage type:** Astro DB
- **Main entities:** `job_applications`, `job_application_events`, `Faq`
- **Persistence expectations:** Application records and timeline history persist per authenticated user.
- **User model:** Single-user ownership of each application

## 6) Special Logic (Optional)
- Timeline events are first-class records, not just UI logs, which helps preserve historical state changes.
- Next-action and follow-up fields let the app surface needs-attention and ordering logic beyond a flat list.
- Dashboard summaries derive from the persisted application pipeline rather than client-only counters.

## 7) Edge Cases & Error Handling
- Invalid ownership: Application and event mutations should reject any record not owned by the authenticated user.
- Missing routes/records: Invalid application references should fail safely instead of exposing other users’ data.
- Delete/archive actions: Destructive actions should require confirmation and refresh the canonical list after completion.
- Partial planning data: Optional follow-up or interview fields should remain optional without creating broken timeline records.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Create applications in different statuses and confirm summary metrics and list groupings update.
- [ ] Edit an application’s stage, next action, and notes, then confirm timeline events and latest state both persist.
- [ ] Delete an application and confirm it is removed cleanly from the UI and no orphaned state remains.

### Safety tests
- [ ] Open an invalid app route and confirm the app fails safely.
- [ ] Confirm unauthenticated access to app routes redirects through the parent auth boundary.
- [ ] Confirm follow-up/interview updates do not create duplicate or malformed event history.

### Negative tests
- [ ] Confirm V1 does not implement resume submission automation, employer collaboration, or external ATS sync.
- [ ] Confirm helper text or intelligence labels do not imply autonomous AI actions that the app does not actually perform.

## 9) Out of Scope (V1)
- External ATS integration
- Resume or cover-letter generation inside this repo
- Shared recruiter/team collaboration
- Auto-apply or autonomous outreach workflows

## 10) Freeze Notes
- V1 freeze: this document reflects the current application-pipeline and timeline-history implementation.
- Current implementation appears stable and production-oriented; final QA should still browser-verify drawer CRUD, timeline rendering, and destructive-action confirmation flows.
- During freeze, only verification fixes, cleanup, and documentation updates are allowed.
