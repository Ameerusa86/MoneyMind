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
9. ✅ **Auth System** (Better-Auth with email/username + Google/GitHub OAuth)
10. ✅ **MongoDB Integration** (Mongoose models, authenticated API routes, split auth/app databases)

---

## 🚀 Phase 2: Enhancement & Polish (CURRENT PHASE)

### Priority Features:

**1. Data Migration Utility** (URGENT - for existing localStorage users)
**2. Settings Page** (Types Ready)
**3. Import/Export UI** (Backend Ready)

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

## Ticket: Data Migration Utility ⚠️ URGENT

- Branch: `feature/data-migration`
- Status: 🔴 NOT STARTED
- Priority: HIGH - Needed for existing users with localStorage data
- Goals: Migrate existing localStorage data to MongoDB via API.
- Tasks:
  - Create `/migrate` page or add to settings.
  - Detect if localStorage has existing data.
  - Button to migrate all data to MongoDB (accounts, bills, expenses, etc.).
  - Show migration progress/status.
  - Validate and transform data before API calls.
  - Option to backup localStorage before migration.
  - Clear localStorage after successful migration.
  - Handle errors gracefully with rollback option.
- Acceptance:
  - User can migrate all localStorage data to MongoDB.
  - Data integrity maintained during migration.
  - Clear feedback on success/failure.

## Ticket: Auth Wiring ✅

- Branch: `feature/auth-wiring` → MERGED
- Status: ✅ COMPLETED
- Implementation: Better-Auth integrated with email/username + OAuth (Google/GitHub)
- Features:
  - Login/Register pages with full UI.
  - Session management with MongoDB.
  - Protected routes with auth guards.
  - Navbar hidden on auth pages.
  - Session monitoring with auto-refresh.

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

## Ticket: MongoDB Integration & Authentication ✅

- Branch: `feature/mongodb-storage-migration` + `feature/auth-wiring` → MERGED
- Status: ✅ COMPLETED
- Implementation:
  - 6 Mongoose models (Account, Bill, Expense, PaySchedule, PayPeriod, PlannedPayment)
  - 12 authenticated API routes with full CRUD
  - Better-Auth with MongoDB adapter
  - Split databases: `WalletWave` (app data) + `WalletWaveAuth` (user/session data)
  - API-based storage layer replacing localStorage
  - Server-side auth guards on all routes
  - Session monitoring and auto-refresh

---

## Phase 1 Completed Tickets (Archive)

### Ticket: Income & Pay Periods ✅

- Branch: `feature/income-schedule`
- Status: COMPLETED
- Implementation: `/income` page with full CRUD, storage helpers, dashboard integration

### Ticket: Accounts (Credit Cards & Loans) ✅

- Branch: `feature/accounts`
- Status: COMPLETED
- Implementation: `/accounts`, `/credit-cards`, `/loans` pages with full CRUD

### Ticket: Bills & Due Dates ✅

- Branch: `feature/bills-due-dates`
- Status: COMPLETED
- Implementation: `/bills` page with recurring bills and upcoming logic

### Ticket: Payment Planner ✅

- Branch: `feature/payment-planner`
- Status: COMPLETED
- Implementation: `/payment-planner` page with allocation logic

### Ticket: Expenses & Categories ✅

- Branch: `feature/expenses`
- Status: COMPLETED
- Implementation: `/expenses` page with categories, editing, deletion

### Ticket: Calendar & Reminders ✅

- Branch: `feature/calendar`
- Status: COMPLETED
- Implementation: `/calendar` page with month view and upcoming list

### Ticket: Dashboard ✅

- Branch: `feature/dashboard`
- Status: COMPLETED
- Implementation: All dashboard stats wired to real storage data

### Ticket: Data Layer ✅

- Branch: `feature/data-layer`
- Status: COMPLETED
- Implementation: `lib/storage.ts` with full abstraction and helpers

---

---

## 🔧 Recommended Improvements & Bug Fixes

### Critical Issues

1. **Missing Icon Files** - Add `icon-192.png` to remove 404 errors
2. **Mongoose Index Warnings** - Remove duplicate index declarations in schemas
3. **Chart Dimension Warnings** - Set explicit width/height on chart containers

### Performance & UX

4. **API Error Handling** - Add user-facing error messages and toast notifications
5. **Loading States** - Add skeleton loaders for async data fetching
6. **Optimistic Updates** - Update UI immediately, rollback on error
7. **Data Validation** - Add client-side validation before API calls
8. **Empty States** - Better UX when no data exists (illustrations, CTAs)

### Security & Data

9. **Rate Limiting** - Add API rate limiting to prevent abuse
10. **Input Sanitization** - Sanitize all user inputs on API routes
11. **HTTPS Enforcement** - Ensure production uses HTTPS only
12. **Session Timeout** - Adjust session expiry based on usage patterns

### Developer Experience

13. **API Documentation** - Add OpenAPI/Swagger docs for API routes
14. **Error Logging** - Integrate error tracking (Sentry, LogRocket)
15. **E2E Tests** - Add Playwright tests for critical user flows
16. **Storybook** - Component library for UI consistency

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
