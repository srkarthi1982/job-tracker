# Job Tracker

Job Tracker is an Ansiversa mini-app for tracking job applications from wishlist to offer.

## Slice 1 Scope
- Create job application entries
- View all user applications
- Edit entries in drawer flow
- Update status quickly
- Delete entries
- Emit baseline dashboard summary payload

## Routes
- `/` landing page
- `/app/job-applications` core app list + drawer CRUD
- `/help` quick usage guidance

## Data Model
- Table: `job_applications`
- Status contract: `wishlist | applied | interview | offer | rejected`

## Commands
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run db:push`

## Verification
- Checklist: `docs/verification/job-tracker-slice-1-checklist.md`
