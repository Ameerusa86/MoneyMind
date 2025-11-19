# Feature Plan & Tickets

Derived from current workflow:

- Paid every 2 weeks
- Open credit card/loan sites, check balances, then pay
- Choose payment amounts based on balances
- Track income, expenses, due dates, and payments

Branch naming: `feature/<kebab-case-feature>`

PRs: one PR per feature branch after local testing.

## Recommended Sequence

1. Income & Pay Periods
2. Accounts (Credit Cards & Loans)
3. Bills & Due Dates
4. Payment Planner (Allocation per paycheck)
5. Expenses & Categories
6. Calendar & Reminders
7. Dashboard (Charts, breakdowns)
8. Auth Wiring (use existing pages)
9. Data Layer (storage abstraction)
10. Import/Export
11. Settings

---

## Ticket: Income & Pay Periods

- Branch: `feature/income-schedule`
- Goals: Define bi-weekly pay periods, upcoming pay dates, and net amount per paycheck.
- Tasks:
  - Define types: `PayPeriod`, `PaySchedule` in `lib/types.ts`.
  - UI: simple form to set pay frequency (bi-weekly), next paycheck date, and typical net amount.
  - Logic: compute next N pay dates; expose selector for “current cycle”.
  - Persist schedule to storage (temporary: localStorage) via `lib/storage.ts`.
  - Add summary to dashboard.
- Acceptance:
  - User can set bi-weekly schedule and see next 3 pay dates.
  - Data persists on reload.

## Ticket: Accounts (Credit Cards & Loans)

- Branch: `feature/accounts`
- Goals: Create accounts with balances and metadata to plan payments.
- Tasks:
  - Types: `Account { id, name, type: 'credit'|'loan', balance, apr?, minPayment, dueDay, website? }`.
  - UI: CRUD list (add/edit/remove) accounts with validations.
  - Persist accounts; sync with due dates feature.
- Acceptance:
  - Add at least one credit card and one loan; balances saved.

## Ticket: Bills & Due Dates

- Branch: `feature/bills-due-dates`
- Goals: Track recurring bills (including card/loan due dates) and notify upcoming.
- Tasks:
  - Types: `Bill { id, name, amount|min, dueDay, accountId?, recurrence='monthly' }`.
  - UI: manage bills; link to `Account` when applicable.
  - Generate "Upcoming in next pay period" list based on income schedule.
- Acceptance:
  - Upcoming bills show correctly for the selected pay cycle.

## Ticket: Payment Planner

- Branch: `feature/payment-planner`
- Goals: Allocate each paycheck to bills before next paycheck and to debt strategy (snowball/avalanche later).
- Tasks:
  - Compute paycheck net minus must-pay bills due before next paycheck.
  - Allow custom allocations to each account/bill.
  - Save a "Planned Payment" record per cycle.
- Acceptance:
  - Planner prevents over-allocation and saves a per-cycle plan.

## Ticket: Expenses & Categories

- Branch: `feature/expenses`
- Goals: Record expenses; categorize and view totals.
- Tasks:
  - Types: `Expense { id, date, amount, category, accountId?, note }` and `Category` enum.
  - UI: quick-add expense; list and monthly totals.
  - Persist and show in dashboard components.
- Acceptance:
  - New expenses appear in Recent Transactions and Monthly Chart.

## Ticket: Calendar & Reminders

- Branch: `feature/calendar`
- Goals: Calendar view of bills/due dates and paydays.
- Tasks:
  - Derive calendar events from `PaySchedule` and `Bill`/`Account.dueDay`.
  - Month view component with markers and upcoming list.
- Acceptance:
  - Paydays and due dates visible for the current month.

## Ticket: Dashboard

- Branch: `feature/dashboard`
- Goals: Wire existing components to real data.
- Tasks:
  - Feed `components/monthly-chart.tsx`, `expense-breakdown.tsx`, and `recent-transactions.tsx` from storage.
  - Add total debt and next due summary.
- Acceptance:
  - Dashboard reflects saved data and updates live.

## Ticket: Auth Wiring

- Branch: `feature/auth`
- Goals: Connect existing `login`/`register` pages to basic state (client-only for now).
- Tasks:
  - Stub auth state; protect main app routes when not logged in.
  - Prepare for future backend integration.
- Acceptance:
  - Simple session state toggles access to app pages.

## Ticket: Data Layer

- Branch: `feature/data-layer`
- Goals: Storage abstraction to swap localStorage with backend later.
- Tasks:
  - `lib/storage.ts`: get/set by key with JSON serialization and versioning.
  - Typesafe helpers for entities.
- Acceptance:
  - All data access goes through the storage module.

## Ticket: Import/Export

- Branch: `feature/import-export`
- Goals: Export current state to JSON and import back.
- Acceptance:
  - Export downloads a JSON file; import restores data.

## Ticket: Settings

- Branch: `feature/settings`
- Goals: App preferences (currency, first day of week, theme is existing).
- Acceptance:
  - Settings persist and affect UI.

---

## Git Commands (PowerShell)

```powershell
# Create a new feature branch from master
git checkout master
git pull
git checkout -b feature/income-schedule

# After commits
git push -u origin feature/income-schedule

# Open PR on GitHub and merge after review
```
