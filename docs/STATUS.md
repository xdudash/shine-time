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
- Isolated Supabase integration passed (GitHub run 34155673938): real Auth for
  all five roles, owner booking, cleaner transitions/checklist, signed Storage
  upload, repeated photo finalization and completion. No production data used.
- GitHub repository: https://github.com/xdudash/shine-time (private).
- Native PostgreSQL 17 contention test passed: 50 concurrent claims, one winner;
  50 repeated completions, one event; 50 independent jobs accepted concurrently.
  CI run 34155083282 completed successfully.
  This tests database correctness, not live Auth/Storage or an end-to-end SLA.
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
- Real Realtime delivery and full role-specific staging acceptance.
- Full localization acceptance, exports and remaining operational history review.
- Backup/restore drill and operational monitoring/alert configuration.
- Production migrations, Edge Function deployment, Hostinger file update and
  enabling the recurring Cron schedule after acceptance.

Bank/card transfers are not integrated: settlement entries record actual external
payments and corrections; they do not move money.

Reproduce local checks: npm ci; npm test; npm run build; node tests/browser.mjs.
See deployment/README.md and scripts/test-concurrency.mjs for additional gates.
