# Feature Plan & Tickets

Derived from current workflow:

- Paid every 2 weeks
- Open credit card/loan sites, check balances, then pay
- Choose payment amounts based on balances
- Track income, expenses, due dates, and payments

Branch naming: `feature/<kebab-case-feature>`

PRs: one PR per feature branch after local testing.

---

## 🎉 Phase 1: Core Features (COMPLETED)

The following features have been fully implemented and merged:

1. ✅ Income & Pay Periods
2. ✅ Accounts (Credit Cards & Loans)
3. ✅ Bills & Due Dates
4. ✅ Payment Planner (Allocation per paycheck)
5. ✅ Expenses & Categories
6. ✅ Calendar & Reminders
7. ✅ Dashboard (Charts, breakdowns)
8. ✅ Data Layer (storage abstraction)

---

## 🚀 Phase 2: Enhancement & Polish (CURRENT PHASE)

### Priority Features:

**1. Import/Export UI** (Backend Ready)
**2. Settings Page** (Types Ready)
**3. Auth Wiring** (Pages Ready)

### Enhancement Opportunities:

**4. Enhanced Expense Tracking**
**5. Debt Payoff Strategies**
**6. Reports & Analytics**
**7. Mobile Responsiveness**
**8. Data Backup & Sync**

---

## Ticket: Import/Export UI

- Branch: `feature/import-export-ui`
- Status: 🟡 Backend ready, needs UI
- Goals: Add user-facing interface to export/import data as JSON.
- Tasks:
  - Create `/settings/data` page or add to settings.
  - Export button downloads JSON file with all storage data.
  - Import button accepts JSON file and validates before restoring.
  - Add confirmation dialogs for destructive operations.
  - Display data size and last backup date.
- Acceptance:
  - User can export all data to JSON file.
  - User can import and restore from JSON file.
  - Clear warnings before overwriting existing data.

## Ticket: Settings Page

- Branch: `feature/settings-ui`
- Status: 🟡 Types ready, needs UI
- Goals: User preferences for currency, week start, and theme.
- Tasks:
  - Create `/settings` page with form for AppSettings.
  - Currency selector (USD, EUR, GBP, etc.).
  - First day of week (Sunday/Monday).
  - Theme selector (light/dark/system) - integrate with existing theme-toggle.
  - Save to `StorageKeys.SETTINGS`.
  - Apply currency format across all components.
- Acceptance:
  - Settings persist and apply immediately.
  - Currency formatting respects selected currency.

## Ticket: Auth Wiring

- Branch: `feature/auth-wiring`
- Status: 🟡 Pages ready, needs logic
- Goals: Basic client-side authentication with route protection.
- Tasks:
  - Create auth context with login/logout/register methods.
  - Hash passwords (bcrypt) and store users in localStorage (temp).
  - Protect app routes with auth guard.
  - Redirect to login if not authenticated.
  - Add logout button to navbar.
  - Session management with expiry.
- Acceptance:
  - Unauthenticated users redirected to login.
  - Login/register flows work correctly.
  - Session persists on page refresh.

## Ticket: Enhanced Expense Tracking

- Branch: `feature/expense-enhancements`
- Goals: Improve expense entry and tracking.
- Tasks:
  - Add receipt upload/photo capture.
  - Add tags/labels for expenses.
  - Split expenses (shared costs).
  - Recurring expense templates.
  - Bulk operations (delete multiple, export selection).
  - Advanced filters (date range, amount range, multiple categories).
- Acceptance:
  - Users can attach receipts to expenses.
  - Filter and search work smoothly.

## Ticket: Debt Payoff Strategies

- Branch: `feature/debt-strategies`
- Goals: Implement snowball and avalanche debt payoff calculators.
- Tasks:
  - UI to select strategy (snowball/avalanche/custom).
  - Calculate payoff timeline for each account.
  - Visual timeline/progress bars.
  - "What-if" scenarios with extra payments.
  - Recommended payment allocation per paycheck.
- Acceptance:
  - Timeline shows payoff dates for all debts.
  - Strategy comparison available.

## Ticket: Reports & Analytics

- Branch: `feature/reports`
- Goals: Generate insights and detailed reports.
- Tasks:
  - Spending trends by category over time.
  - Income vs. expenses comparison (multiple months).
  - Net worth tracker over time.
  - Savings rate calculator.
  - Export reports as PDF or CSV.
  - Customizable date ranges.
- Acceptance:
  - Generate monthly/quarterly/yearly reports.
  - Visualizations clear and useful.

## Ticket: Mobile Responsiveness Audit

- Branch: `feature/mobile-polish`
- Goals: Ensure all pages work well on mobile devices.
- Tasks:
  - Test all pages on mobile viewport.
  - Fix navigation drawer/mobile menu.
  - Optimize tables for small screens.
  - Touch-friendly buttons and forms.
  - PWA manifest for install prompt.
- Acceptance:
  - All features usable on mobile.
  - App installable as PWA.

## Ticket: Data Backup & Sync

- Branch: `feature/backup-sync`
- Goals: Automatic backups and cross-device sync preparation.
- Tasks:
  - Periodic auto-export to browser download.
  - Cloud storage integration (Google Drive/Dropbox).
  - Conflict resolution for multi-device edits.
  - Version history for rollback.
- Acceptance:
  - User data backed up automatically.
  - Can restore from cloud backup.

---

## Phase 1 Completed Tickets (Archive)

<details>
<summary>Click to view Phase 1 tickets</summary>

## Ticket: Income & Pay Periods ✅

- Branch: `feature/income-schedule`
- Status: COMPLETED
- Implementation: `/income` page with full CRUD, storage helpers, dashboard integration

## Ticket: Accounts (Credit Cards & Loans) ✅

- Branch: `feature/accounts`
- Status: COMPLETED
- Implementation: `/accounts`, `/credit-cards`, `/loans` pages with full CRUD

## Ticket: Bills & Due Dates ✅

- Branch: `feature/bills-due-dates`
- Status: COMPLETED
- Implementation: `/bills` page with recurring bills and upcoming logic

## Ticket: Payment Planner ✅

- Branch: `feature/payment-planner`
- Status: COMPLETED
- Implementation: `/payment-planner` page with allocation logic

## Ticket: Expenses & Categories ✅

- Branch: `feature/expenses`
- Status: COMPLETED
- Implementation: `/expenses` page with categories, editing, deletion

## Ticket: Calendar & Reminders ✅

- Branch: `feature/calendar`
- Status: COMPLETED
- Implementation: `/calendar` page with month view and upcoming list

## Ticket: Dashboard ✅

- Branch: `feature/dashboard`
- Status: COMPLETED
- Implementation: All dashboard stats wired to real storage data

## Ticket: Data Layer ✅

- Branch: `feature/data-layer`
- Status: COMPLETED
- Implementation: `lib/storage.ts` with full abstraction and helpers

</details>

---

## Git Commands (PowerShell)

```powershell
# Create a new feature branch from master
git checkout master
git pull
git checkout -b feature/<ticket-name>

# After commits
git push -u origin feature/<ticket-name>

# Open PR on GitHub and merge after review
# Delete branch after merge
git branch -d feature/<ticket-name>
```
