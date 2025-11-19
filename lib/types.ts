// Core domain types for the finance tracker

export type PayFrequency = "weekly" | "bi-weekly" | "semi-monthly" | "monthly";

export interface PaySchedule {
  id: string;
  frequency: PayFrequency;
  nextPayDate: string; // ISO date string
  typicalAmount: number;
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
}

export interface PlannedPayment {
  id: string;
  payPeriodId: string;
  accountId?: string;
  billId?: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  theme?: "light" | "dark" | "system";
}
