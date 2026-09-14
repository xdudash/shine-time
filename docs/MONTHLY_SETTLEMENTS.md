# Monthly settlements and cleaner workspace

Admin Finance defaults to monthly counterparties: Clients and Cleaners. Each
row aggregates all completed jobs for the chosen service month, including
previous payments and refunds. Open a counterparty, select all unpaid jobs or
individual jobs, review the sum, and record one receipt/payout. This records
money already transferred; it does not initiate a bank transfer.

Selections capture reviewed balances. PostgreSQL validates the actor, month,
counterparty and every job, locks jobs in ascending ID order, and either writes
all allocations or rolls back everything. A stable request key replays the
original result without creating another payment. The existing immutable
settlement ledger is retained; a batch record links its request and allocations.
Notes are optional for batches and receive a meaningful default. Individual
payments/refunds remain accessible through the By cleaning tab; their required
note is now marked in the form.

All monthly totals are calculated in SQL, without the REST row limit. One
counterparty detail supports up to 5000 rows; larger results show a limit warning.
Batches settle the remaining balances of selected jobs; partial single-job
payments remain on the By cleaning tab. There is no automatic bank transfer,
invoice issuance or cross-month allocation in this update.

The cleaner's default screen now presents the next active job, remaining jobs,
completed earnings for the chosen day, the rest of the schedule, completed
history, availability, marketplace and monthly earnings. The existing protected
job workflow retains instructions, route, checklist, proof and issue reporting.

Validation: 48 local tests passed, including 1000-job aggregation, batch rollback,
wrong-party rejection, replay and overpayment prevention. Strict TypeScript and
production build passed. CI additionally checks overlapping batches with native
PostgreSQL sessions and authenticated monthly API flows in isolated Supabase.
Production migration and deployment require those checks to pass.
