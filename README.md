# Shine Time Operations

Cleaning operations platform: Hostinger frontend, Supabase backend.

## Components

- Hostinger `/app`: PHP entry page, mobile PWA, static assets.
- Supabase Auth: administrator, operations manager, cleaner, owner and property manager.
- Edge Function `st-api`: authenticated API and role-scoped responses.
- PostgreSQL: transactional assignment and completion, recurring jobs, exact financial records.
- Private Storage: signed photo/video reports with verified finalization.
- Realtime: scoped invalidation events and periodic reconciliation.

## Verification

Run `npm ci`, `npm test`, and `npm run build`.
GitHub Actions also starts native PostgreSQL 17 for concurrent job-command tests
and checks financial aggregates against 100,000 synthetic jobs.

See [verification status](docs/STATUS.md) and [deployment procedure](deployment/README.md).
Production deployment is separate from uploading this repository. Existing customer
data must be preserved; do not reinstall the baseline schema on the production database.
