// Core domain types for WalletWave

export type PayFrequency = "weekly" | "bi-weekly" | "semi-monthly" | "monthly";

export interface PaySchedule {
  id: string;
  frequency: PayFrequency;
  nextPayDate: string; // ISO date string
  typicalAmount: number;
  depositAccountId?: string; // Checking/Savings account where income is deposited
  owner?: string; // Optional label: "self", "spouse", or custom name
  createdAt: string;
  updatedAt: string;
}

export interface PayPeriod {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  payDate: string; // ISO date string
  expectedAmount: number;
  actualAmount?: number;
  depositAccountId?: string; // Checking/Savings account where this paycheck was deposited
}

export type AccountType = "credit" | "loan" | "checking" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  apr?: number; // Annual percentage rate
  minPayment?: number;
  dueDay?: number; // Day of month (1-31)
  creditLimit?: number; // For credit cards
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillRecurrence =
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface Bill {
  id: string;
  name: string;
  amount?: number; // Fixed amount
  minAmount?: number; // Minimum amount (for flexible bills)
  dueDay: number; // Day of month (1-31)
  recurrence: BillRecurrence;
  accountId?: string; // Link to Account if applicable
  isPaid?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | "groceries"
  | "dining"
  | "transportation"
  | "utilities"
  | "entertainment"
  | "healthcare"
  | "shopping"
  | "housing"
  | "insurance"
  | "debt"
  | "savings"
  | "other";

export interface Expense {
  id: string;
  date: string; // ISO date string
  amount: number;
  category: ExpenseCategory;
  accountId?: string;
  description?: string;
  createdAt: string;
  transactionId?: string; // linked Transaction id if auto-created
}

export interface PlannedPayment {
  id: string;
  payPeriodId: string;
  accountId?: string;
  billId?: string;
  amount: number;
  note?: string;
  executedAt?: string; // ISO date string when payment was executed
  transactionId?: string; // Link to Transaction that executed this payment
  createdAt: string;
}

export type TransactionType =
  | "income_deposit"
  | "payment"
  | "expense"
  | "transfer"
  | "adjustment";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  fromAccountId?: string; // Source account (optional for income_deposit)
  toAccountId?: string; // Destination account (optional for expense)
  amount: number;
  date: string; // ISO date string
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>; // For extensibility (e.g., payPeriodId, expenseId)
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  theme?: "light" | "dark" | "system";
}
