# Payment Workflow Guide

## Overview

MoneyMind provides three complementary pages for managing your debt payments and refunds. Each serves a distinct purpose in your financial workflow.

## The Three Pages

### 1. Payment Planner (`/payment-planner`)

**Purpose**: Pre-paycheck allocation workspace  
**When to Use**: Before your paycheck arrives, to plan where money will go

**Features**:

- Shows upcoming bills due before next pay date
- Lists all credit/loan accounts for optional extra payments
- Input allocation amounts for each
- Validates total doesn't exceed paycheck amount
- Saves plan for later execution
- Displays total allocated vs remaining

**Workflow**:

1. Set your pay schedule on Income page first
2. Open Payment Planner
3. Enter amounts for upcoming bills
4. Add optional extra debt payments
5. Click "Save Plan" to persist allocations
6. Optionally click "Post Payments" to execute immediately (or wait for payday)

**Output**: Creates `PlannedPayment` records for the pay period

---

### 2. Payday Page (`/payday`)

**Purpose**: Guided session for processing a specific paycheck  
**When to Use**: On the day you receive your paycheck

**Features**:

- Multi-step wizard (Income → Review → Execute → Summary)
- Records actual income deposits (may differ from typical amount)
- Reviews planned or ad-hoc payment allocations
- Executes all selected payments in one batch
- Shows before/after account balances
- Tags transactions with pay period metadata

**Workflow**:

1. **Step 1 - Record Income**: Enter actual deposit amounts and accounts
2. **Step 2 - Review Allocations**: See planned payments from Payment Planner or add new ones
3. **Step 3 - Execute**: Batch-create all payment transactions and mark bills paid
4. **Step 4 - Summary**: Review what changed (deposits, payments, balance impacts)

**Output**:

- Income transactions (type: `income_deposit`)
- Payment transactions (type: `payment`) with `payPeriodId` metadata
- Bills marked as `isPaid`
- Updates `PlannedPayment` records with `executedAt` timestamp

---

### 3. Payments Page (`/payments`)

**Purpose**: Always-on manual ledger for payments and refunds  
**When to Use**: Anytime you need to add/view/link payments outside the payday ceremony

**Features**:

- Lists all payment transactions (including those from Payday/Planner)
- Manual payment creation (one-off, mid-period extras)
- Refund creation with automatic linking to original expense
- Link existing payments to expenses as refunds
- Shows which payments are refunds with badge + original amount

**Workflow - Manual Payment**:

1. Click "New Payment / Refund"
2. Enter amount, date, description
3. Select debt account (toAccount = credit/loan)
4. Optionally select source bank (fromAccount = checking/savings)
5. If refund, toggle "Is Refund?" and select original expense
6. Click "Create"

**Workflow - Link Existing Payment as Refund**:

1. Find payment in table
2. Click "Link Refund" button
3. Select the original expense transaction
4. System updates payment metadata with `refundFor`, `originalAmount`, `partial` flag

**Output**:

- Payment transactions (type: `payment`)
- Refunds have `metadata.refundFor` linking to expense ID
- Expenses page shows refund badges based on these links

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAYMENT WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

BEFORE PAYDAY (Optional Planning)
┌──────────────────┐
│ Payment Planner  │  ← Set up allocations before paycheck arrives
│  /payment-planner│
└────────┬─────────┘
         │ Save Plan
         ↓
   PlannedPayment records created


ON PAYDAY (Structured Execution)
┌──────────────────┐
│   Payday Page    │  ← Guided session: income + batch payments
│     /payday      │
└────────┬─────────┘
         │
         ├─ Step 1: Record Income → income_deposit transactions
         │
         ├─ Step 2: Review planned/ad-hoc payments
         │
         ├─ Step 3: Execute → payment transactions + bills marked
         │
         └─ Step 4: Summary (balance changes)


ANYTIME (Manual Adjustments)
┌──────────────────┐
│  Payments Page   │  ← Manual entries, refunds, corrections
│    /payments     │
└────────┬─────────┘
         │
         ├─ Add one-off payment (not part of payday)
         │
         ├─ Create refund linked to expense
         │
         ├─ Link existing payment to expense as refund
         │
         └─ Audit all payment history


REFUND FLOW (Special Case)
┌──────────────────┐          ┌──────────────────┐
│  Expenses Page   │─────────→│  Payments Page   │
│    /expenses     │  "Mark   │    /payments     │
└──────────────────┘  Refund" └──────────────────┘
         ↑                              │
         │           Creates payment    │
         │           with metadata      │
         └──────────────────────────────┘
                  Displays refund badge
```

---

## Key Differences

| Feature      | Payment Planner  | Payday Page        | Payments Page        |
| ------------ | ---------------- | ------------------ | -------------------- |
| **Timing**   | Before paycheck  | Day of paycheck    | Anytime              |
| **Purpose**  | Planning         | Execution ceremony | Manual ledger        |
| **Workflow** | Allocate amounts | Multi-step wizard  | Direct entry         |
| **State**    | Saves plan       | Transient session  | Persistent list      |
| **Batch**    | Optional         | Yes (step 3)       | No (one at a time)   |
| **Refunds**  | No               | No                 | Yes (primary)        |
| **Income**   | No               | Yes (step 1)       | No                   |
| **Bills**    | Shows upcoming   | Uses plan          | Not focused on bills |
| **Metadata** | Creates plan IDs | Adds payPeriodId   | Adds refundFor       |

---

## Navigation Tips

- **From Payment Planner**: Click "Post Payments" to execute immediately, or note your plan and open Payday Page on payday
- **From Payday Page**: After summary, visit Payments Page to add any missed items or refunds
- **From Expenses Page**: Click "Mark Refund" → opens Payments Page refund dialog
- **From Payments Page**: View all payment history across all sources (planner, payday, manual)

---

## Common Scenarios

### Scenario 1: Standard Paycheck

1. (Optional) Open Payment Planner → allocate upcoming bills → Save Plan
2. On payday: Open Payday Page
3. Record income deposit
4. Review/execute planned payments
5. Review summary and close

### Scenario 2: Mid-Period Extra Payment

1. Open Payments Page
2. Click "New Payment / Refund"
3. Enter amount, select debt account
4. Submit (no payday ceremony needed)

### Scenario 3: Credit Card Refund

1. Open Expenses Page → find original charge
2. Click "Mark Refund" or "Add Refund"
3. Enter refund amount and date
4. System creates payment with `metadata.refundFor`
5. Badge appears on expense showing partial/full refund

### Scenario 4: Correcting a Payment

1. Open Payments Page
2. Find the payment in list
3. Click "Link Refund" if it was actually a refund
4. Or create new correcting transaction

---

## Data Relationships

```
PlannedPayment (from Payment Planner)
    ↓ executed on Payday Page
Transaction (type: payment, with payPeriodId)

Transaction (type: expense) ← original charge
    ↓ refunded on Payments Page
Transaction (type: payment, with metadata.refundFor)
```

---

## Best Practices

1. **Set Pay Schedule First**: Required for Payment Planner and Payday Page to work
2. **Plan Early**: Use Payment Planner days before payday to think through allocations
3. **Execute on Payday**: Use Payday Page for the ceremony and batch consistency
4. **Manual for Exceptions**: Use Payments Page for anything outside normal payday flow
5. **Link Refunds Properly**: Always use "Mark Refund" to maintain expense-payment relationship
6. **Review Regularly**: Check Payments Page to audit all payment history

---

## Technical Notes

- **Pay Period ID**: Derived from next pay date (YYYY-MM-DD format)
- **Planned Payments**: Stored with `payPeriodId`, optional `billId` or `accountId`
- **Executed Payments**: Have `executedAt` timestamp to prevent re-execution
- **Refund Metadata**: `{ refundFor: expenseId, originalAmount: number, partial: boolean }`
- **Transaction Keys**: Deterministic hash prevents duplicate imports
- **Balance Impact**: Payments reduce debt account balances (credit/loan)
