# Shine Time v6 rewrite

## Architecture

React/TypeScript features under frontend/src replace the legacy DOM scripts.
App owns authentication, role navigation, language, and realtime refresh.
The API transport owns authenticated requests, uncertain-result idempotency and
signed media upload. The query layer deduplicates fetches, preserves mounted
forms during background updates, and discards responses from previous sessions.
Feature modules cover jobs, properties, people, settlements, recurring schedules,
issues, account, notifications and settings. QA transport is isolated from the
production esbuild graph.

The st-api entrypoint composes runtime, authentication, job services and
role-specific route factories. PostgreSQL commands remain the transaction and
permission boundary. Existing tables, RPCs, Auth identities and private Storage
are retained. No new database migration is required for this release.

## Build and Hostinger upload

Run npm ci, npm run typecheck, npm test, npm run build:v6, then
python scripts/package-v6.py. GitHub verification publishes hostinger-v6.

Deploy st-api first, preserving verify_jwt=true. Old clients remain compatible.
Upload the contents of artifacts/Shine_Time_v6_app.zip directly into
public_html/app and replace matching files. Do not create app/app or copy QA
files. The ZIP includes index.php, .htaccess, the public Supabase configuration,
and the two production assets. No database credentials or service-role key.
Keep an external copy of the current app directory for rollback. Upload assets
and config before replacing index.php, then refresh the browser. The legacy
service worker uses network-first asset requests and never caches navigation;
versioned platform filenames therefore do not require clearing login storage.

## Verification and limits

2026-09-09: 47 local tests passed, TypeScript and production bundle passed.
GitHub 34336820049 passed full verification including native PostgreSQL
concurrency checks. Integration 34336820043 is still pending at this checkpoint.
Browser QA passed cleaner status progression through completion, saved
checklist state, and terminal controls. Background refresh preserves an unsaved
property draft. Mobile layout checked at 390 px; body has no horizontal overflow.
All browser QA uses synthetic data and does not access the production database.

Production frontend acceptance still requires the Hostinger upload and a
signed-in check there. These checks establish functional correctness, not an
Uber-scale SLA. Job/property list pagination, measured production load capacity,
and external payment-provider charging are not established by this release.
