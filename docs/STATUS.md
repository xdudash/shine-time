# Development verification — 2026-09-07-scale1

Production has not been modified or deployed. This source is not a production
acceptance certificate.

Implemented: transactional job commands; scoped realtime signals; role response
projection; stable live UI and password recovery; individual service windows;
recurring schedule generation and isolated-error worker; exact settlement ledger;
paginated settlement and manual payment history; SQL finance/trend aggregation;
direct signed photo/video upload and idempotent finalization; transactional proof
and checklist writes; retention-aware cleanup of unreferenced expired uploads.
The previous photo API and browser build remain compatible during rollout.

Verified:
- 40 automated tests pass, none skipped. SQL tests use isolated PGlite PostgreSQL.
- Full database workflow: owner booking, automatic assignment, status transitions,
  checklist, required photo, completion, client payment and cleaner payout.
- Browser fixtures: unsaved input/focus survive realtime; mobile width; cleaner
  navigation; quoted photo categories; video preview; photo upload UI; recurring
  and settlement screens. These tests use synthetic API responses, not live Auth.
- 100,000 synthetic jobs: exact totals, settlement report 1,640 ms with a bounded
  100-row page; finance report 1,159 ms. These are local measurements, not an SLA.
- Frontend build, Edge Function bundle and PHP syntax checks pass.

Mandatory release gates still open:
- Native PostgreSQL simultaneous-request test (50 connections). Runnable script and
  GitHub Actions workflow included, but no native database or connected repository
  is available in this environment. PGlite serializes sessions.
- Staging roundtrip with real Supabase Auth, Storage, Realtime and all five roles.
- Full localization acceptance, exports and remaining operational history review.
- Backup/restore drill and operational monitoring/alert configuration.
- Production migrations, Edge Function deployment, Hostinger file update and
  enabling the recurring Cron schedule after acceptance.

Bank/card transfers are not integrated: settlement entries record actual external
payments and corrections; they do not move money.

Reproduce local checks: npm ci; npm test; npm run build; node tests/browser.mjs.
See deployment/README.md and scripts/test-concurrency.mjs for additional gates.
