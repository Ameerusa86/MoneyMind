# Feature Plan & Tickets

## Real-World Workflow → App Flow

### The Core Flow (Biweekly Payday Cycle)

**🪙 Step 1: Paychecks arrive**

- Both spouses get paid every 2 weeks into separate checking accounts
- App creates `income_deposit` Transactions for each paycheck
- Checking account balances update automatically
- PayPeriod model links deposits to specific accounts via `depositAccountId`

**🧾 Step 2: Payday session - divvy up the money**

- Sit together and review all credit cards, loans, and bills
- See current balances (updated in real-time from daily spending)
- Decide payment amounts for each account
- Choose which checking account pays which debt (his vs hers)
- Execute all payments in one batch:
  - Creates payment Transactions
  - Checking balances decrease
  - Credit card/loan balances decrease
  - PlannedPayments marked as executed

**🧺 Step 3: Daily credit card usage**

- Use credit cards for all daily expenses (groceries, gas, dining, etc.)
- Each expense creates a Transaction that increases card balance
- Card balances always reflect reality
- By next payday, planner shows true current balances for decision-making

### Key Requirements

- **Multiple income streams**: Support 2+ PaySchedules per user (his + hers)
- **Multi-account payments**: Choose which checking account funds each payment
- **Real-time balances**: Daily expenses update card balances immediately
- **Batch payment execution**: Execute multiple planned payments in one session
- **Flexible planning**: Adjust planned amounts based on current reality

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

## 🚀 Phase 2: Transaction System & Core Payment Flow (CURRENT PHASE)

### Transaction System Foundation

This phase implements the Transaction model and wires it into the core payment workflow to support the real-world biweekly payday cycle.

**Priority 1: Transaction Model & API** ⚠️ CRITICAL

- Create Transaction model (Mongoose schema)
- Transaction types: `income_deposit`, `payment`, `expense`, `transfer`, `adjustment`
- API routes: GET /api/transactions, POST, GET/PUT/DELETE /api/transactions/[id]
- Link to accounts via `fromAccountId` and `toAccountId`
- Automatically update account balances on transaction creation/deletion

**Priority 2: Payday Session UI** ⚠️ CRITICAL

- New page: `/payday` or `/pay-run`
- Step 1: Record income deposits
  - Show upcoming PayPeriods for both spouses
  - "Record Deposit" button creates `income_deposit` Transaction
  - Updates checking account balances automatically
- Step 2: Review & adjust planned payments
  - Display all credit cards/loans with current balances
  - Show recommended payments from PlannedPayment model
  - Allow adjustment of amounts per account
  - Choose which checking account (his/hers) funds each payment
  - Add ad-hoc payments not in the plan
- Step 3: Execute all payments in batch
  - "Execute All Payments" button
  - Creates payment Transaction for each
  - Updates checking balances (decrease) and credit/loan balances (decrease)
  - Marks PlannedPayments as executed with `executedAt` and `transactionId`
- Step 4: Summary view
  - Total income deposited
  - Total paid to debts
  - Remaining balance in each checking account

**Priority 3: Multiple PaySchedules per User**

- Update PaySchedule to support multiple schedules per user
- Add optional `owner` field: "self" | "spouse" | free-text name
- Each schedule maps to specific `depositAccountId` (his checking vs hers)
- UI to manage multiple income sources on `/income` page

**Priority 4: Real-Time Balance Updates**

- Recalculate account balances from Transactions on page load
- Payment Planner uses current balances, not static values
- Show: "Planned Payment" vs "Current Balance" vs "Remaining After Payment"
- Quick actions: "Pay Minimum", "Pay Off Fully", "Custom Amount"

**Priority 5: Expense Auto-Transaction** (Bump from Phase 6)

- When creating/editing an Expense, automatically create a Transaction
- Transaction type: `expense`
- `fromAccountId`: the credit card account
- Updates card balance immediately (increases debt)
- Manual expense entry on `/expenses` page
- Card balances always reflect daily spending

---

## 🎨 Phase 3: Enhancement & Polish

### Priority Features

**1. Data Migration Utility** (URGENT - for existing localStorage users)
**2. Settings Page** (Types Ready)
**3. Import/Export UI** (Backend Ready)

### Enhancement Opportunities

**4. Enhanced Expense Tracking** (CSV import, receipt upload, tags)
**5. Debt Payoff Strategies** (Snowball/Avalanche calculators)
**6. Reports & Analytics** (Trends, insights, PDF export)
**7. Mobile Responsiveness** (PWA, touch-optimized)
**8. Data Backup & Sync** (Cloud storage integration)

---

## 📋 Phase 2 Tickets: Transaction System & Payment Flow

### Ticket: Transaction Model & API ⚠️ CRITICAL

- Branch: `feature/transaction-model`
- Status: 🔴 NOT STARTED
- Priority: HIGHEST - Foundation for all payment flows
- Goals: Create Transaction model and API to track all money movement.
- Tasks:
  - Create `Transaction` Mongoose model with schema:
    - `userId` (string, required)
    - `type`: `'income_deposit' | 'payment' | 'expense' | 'transfer' | 'adjustment'`
    - `fromAccountId` (string, optional) - source account
    - `toAccountId` (string, optional) - destination account
    - `amount` (number, required)
    - `date` (string, ISO format)
    - `description` (string, optional)
    - `category` (string, optional)
    - `metadata` (object, optional) - for extensibility
    - `createdAt`, `updatedAt` timestamps
  - Create API routes:
    - `GET /api/transactions` - list all for user, with filters (date range, type, account)
    - `POST /api/transactions` - create new transaction
    - `GET /api/transactions/[id]` - get single transaction
    - `PUT /api/transactions/[id]` - update transaction
    - `DELETE /api/transactions/[id]` - delete transaction
  - Add transaction validation logic
  - Export `TransactionStorage` helpers in `lib/storage.ts`
- Acceptance:
  - Transaction model properly typed in `lib/types.ts`
  - All CRUD operations working
  - Transactions queryable by account, date range, type

### Ticket: Account Balance Calculation from Transactions

- Branch: `feature/balance-calculation`
- Status: 🔴 NOT STARTED
- Depends on: `feature/transaction-model`
- Goals: Calculate real-time account balances from transaction history.
- Tasks:
  - Add helper function `calculateAccountBalance(accountId: string, upToDate?: string)`
  - Logic:
    - Start with account's initial balance (or 0)
    - For checking/savings: add income_deposits, subtract payments/expenses/transfers-out
    - For credit cards/loans: add expenses/charges, subtract payments
    - Support "balance as of date" for historical views
  - Update `AccountStorage.getById()` to include calculated balance
  - Add `/api/accounts/[id]/balance` endpoint for real-time balance
  - Option to "sync" stored balance with calculated balance
- Acceptance:
  - Account balances reflect all transactions
  - Historical balance queries work correctly
  - Balance calculation handles all transaction types

### Ticket: Payday Session UI ⚠️ CRITICAL

- Branch: `feature/payday-session`
- Status: 🔴 NOT STARTED
- Depends on: `feature/transaction-model`, `feature/balance-calculation`
- Priority: HIGH - Core user workflow
- Goals: Create unified payday interface for recording income and executing payments.
- Tasks:
  - Create `/payday` page with multi-step flow:
    - **Step 1: Record Income**
      - List upcoming PayPeriods (both spouses if multiple schedules)
      - Show expected amounts and deposit accounts
      - "Record Deposit" button for each:
        - Creates `income_deposit` Transaction
        - Links to PayPeriod via `metadata.payPeriodId`
        - Updates checking account balance
      - Mark PayPeriod as received
    - **Step 2: Review Accounts**
      - Display all credit cards, loans, bills
      - Show current balance (from Transactions)
      - Show planned payment amount (from PlannedPayment)
      - Show minimum payment if applicable
      - Allow editing payment amount per account
      - Dropdown to select source account (which checking)
    - **Step 3: Execute Payments**
      - Summary table of all planned payments
      - Total amount to be paid
      - Remaining balance per checking account after payments
      - "Execute All" button:
        - Creates `payment` Transaction for each
        - Updates all account balances
        - Marks PlannedPayments as executed
        - Logs `executedAt` timestamp and `transactionId`
      - Option to execute individually if needed
    - **Step 4: Summary**
      - Show total income received
      - Total paid to debts
      - Remaining balance per checking account
      - Transaction history for this session
  - Add date/pay-period selector for historical sessions
  - Add ability to save draft allocations before executing
- Acceptance:
  - Can record multiple income deposits in one session
  - Can adjust and execute multiple payments in batch
  - All balances update correctly
  - Session summary shows complete picture

### Ticket: Multiple PaySchedules Support

- Branch: `feature/multiple-payschedules`
- Status: 🔴 NOT STARTED
- Goals: Support multiple income sources per user (both spouses).
- Tasks:
  - Update PaySchedule model:
    - Add `owner` field: optional string (e.g., "Ameer", "Wife", or null)
    - Add `depositAccountId`: required - which checking account receives this income
  - Update `/income` page:
    - Allow creating multiple PaySchedules
    - Show list of all schedules with owner labels
    - Edit/delete per schedule
  - Update PayPeriod generation to respect `depositAccountId`
  - Update UI to clearly label which schedule is which
- Acceptance:
  - Can create 2+ pay schedules per user
  - Each schedule maps to specific checking account
  - Payday Session shows both income sources clearly

### Ticket: Payment Planner Real-Time Balance Integration

- Branch: `feature/planner-realtime-balance`
- Status: 🔴 NOT STARTED
- Depends on: `feature/balance-calculation`
- Goals: Update Payment Planner to use current balances from Transactions.
- Tasks:
  - Update `/payment-planner` page:
    - Fetch current balance per account from Transactions
    - Display: "Current Balance", "Planned Payment", "Balance After Payment"
    - Show difference: "Need $X more to pay off fully"
  - Add quick action buttons:
    - "Pay Minimum" - sets amount to minPayment
    - "Pay Off Fully" - sets amount to current balance
    - "Custom Amount" - user input
  - Recalculate available funds based on current checking balances
  - Warn if total planned payments exceed available funds
  - Save updated plan to PlannedPayment records
- Acceptance:
  - Planner reflects real-time account balances
  - Can quickly adjust payments based on current reality
  - Validates against available checking balance

### Ticket: Expense Auto-Transaction

- Branch: `feature/expense-auto-transaction`
- Status: 🔴 NOT STARTED
- Depends on: `feature/transaction-model`
- Goals: Automatically create Transaction when expense is added/edited.
- Tasks:
  - Update `POST /api/expenses`:
    - After creating Expense, create Transaction:
      - `type: 'expense'`
      - `fromAccountId: expense.accountId`
      - `amount: expense.amount`
      - `date: expense.date`
      - `description: expense.description`
      - `category: expense.category`
      - `metadata: { expenseId: expense.id }`
    - Return both expense and transaction IDs
  - Update `PUT /api/expenses/[id]`:
    - Update corresponding Transaction (find by `metadata.expenseId`)
    - Or create new if doesn't exist (for legacy expenses)
  - Update `DELETE /api/expenses/[id]`:
    - Also delete corresponding Transaction
  - Update `/expenses` page:
    - Show transaction link/status
    - Indicate when expense affects account balance
- Acceptance:
  - Every expense creates a transaction automatically
  - Credit card balances increase when expenses added
  - Deleting expense removes transaction and adjusts balance

---

## 📋 Phase 3 Tickets: Enhancement & Polish

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

---

## 🔄 Complete App Flow After Transaction System

Once Phase 2 is complete, here's how the app mirrors your real-world biweekly payday cycle:

### Payday (Every 2 Weeks)

1. **Open `/payday` page**
2. **Record income deposits:**
   - Ameer's paycheck → Checking A (creates `income_deposit` Transaction)
   - Wife's paycheck → Checking B (creates `income_deposit` Transaction)
   - Both checking balances update automatically
3. **Review & allocate payments:**
   - See all credit cards/loans with current balances (from daily spending)
   - Review recommended payments from planner
   - Adjust amounts as needed
   - Choose source account (Checking A or B) for each payment
4. **Execute all payments:**
   - Click "Execute All"
   - App creates `payment` Transaction for each
   - Checking accounts decrease
   - Credit card/loan balances decrease
   - PlannedPayments marked as executed
5. **View summary:**
   - Total income received: $X
   - Total paid to debts: $Y
   - Remaining in checking: $Z

### Throughout the 2 Weeks (Daily Spending)

1. **Daily credit card usage:**
   - Log expenses manually on `/expenses` page
   - Or import CSV later (Phase 3)
2. **Each expense:**
   - Creates `expense` Transaction automatically
   - Credit card balance increases (debt goes up)
   - Category tracked for reporting
3. **Real-time balance updates:**
   - All pages show current balances
   - Dashboard reflects latest spending
   - Calendar shows updated payment needs

### Before Next Payday

1. **Review in `/payment-planner`:**
   - See current balances (updated from daily expenses)
   - Adjust planned payments if needed
   - Set priorities for next paycheck
2. **On payday:**
   - Return to `/payday` page
   - Cycle repeats with fresh income and current balances

### Key Benefits

- ✅ Always know true account balances
- ✅ Make informed payment decisions based on reality
- ✅ Track all money movement in one place
- ✅ Historical record of every transaction
- ✅ Both spouses' income managed together
- ✅ No more logging into 10+ bank/card websites

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
