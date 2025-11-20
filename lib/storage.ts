// API-based storage layer for client-side data access
// Replaces localStorage with MongoDB-backed APIs

import type {
  Expense,
  Account,
  Bill,
  PaySchedule,
  PayPeriod,
  PlannedPayment,
  Transaction,
} from "./types";

/**
 * Expense management helpers
 */
export const ExpenseStorage = {
  /**
   * Get all expenses
   */
  async getAll(): Promise<Expense[]> {
    try {
      const res = await fetch("/api/expenses");
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }
  },

  /**
   * Backfill helper: preview missing transaction count
   */
  async getBackfillStatus(): Promise<{
    total: number;
    missingCount: number;
  } | null> {
    try {
      const res = await fetch("/api/expenses/backfill");
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error checking backfill status:", error);
      return null;
    }
  },

  /**
   * Backfill helper: create missing transactions for expenses
   */
  async backfillTransactions(): Promise<{ created: number } | null> {
    try {
      const res = await fetch("/api/expenses/backfill", { method: "POST" });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error backfilling transactions:", error);
      return null;
    }
  },

  /**
   * Get a single expense by ID
   */
  async getById(id: string): Promise<Expense | null> {
    try {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching expense:", error);
      return null;
    }
  },

  /**
   * Add a new expense
   */
  async add(
    expense: Omit<Expense, "id" | "createdAt">
  ): Promise<Expense | null> {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding expense:", error);
      return null;
    }
  },

  /**
   * Update an existing expense
   */
  async update(
    id: string,
    updates: Partial<Omit<Expense, "id" | "createdAt">>
  ): Promise<Expense | null> {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating expense:", error);
      return null;
    }
  },

  /**
   * Delete an expense
   */
  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting expense:", error);
      return false;
    }
  },

  /**
   * Get expenses for a specific month
   */
  async getByMonth(year: number, month: number): Promise<Expense[]> {
    const expenses = await this.getAll();
    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  },

  /**
   * Get expenses by category
   */
  async getByCategory(category: string): Promise<Expense[]> {
    const expenses = await this.getAll();
    return expenses.filter((expense) => expense.category === category);
  },

  /**
   * Get total expenses for a date range
   */
  async getTotalForRange(startDate: string, endDate: string): Promise<number> {
    const expenses = await this.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);
        return date >= start && date <= end;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  },

  /**
   * Get category breakdown for a month
   */
  async getCategoryBreakdown(
    year: number,
    month: number
  ): Promise<Record<string, number>> {
    const expenses = await this.getByMonth(year, month);
    const breakdown: Record<string, number> = {};

    expenses.forEach((expense) => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });

    return breakdown;
  },
};

/**
 * Account management helpers
 */
export const AccountStorage = {
  /**
   * Get all accounts
   */
  async getAll(): Promise<Account[]> {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  },

  /**
   * Get a single account by ID
   */
  async getById(id: string): Promise<Account | null> {
    try {
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching account:", error);
      return null;
    }
  },

  /**
   * Add a new account
   */
  async add(
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Account | null> {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding account:", error);
      return null;
    }
  },

  /**
   * Update an existing account
   */
  async update(
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
  ): Promise<Account | null> {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating account:", error);
      return null;
    }
  },

  /**
   * Delete an account
   */
  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  },
};

/**
 * Bill management helpers
 */
export const BillStorage = {
  /**
   * Get all bills
   */
  async getAll(): Promise<Bill[]> {
    try {
      const res = await fetch("/api/bills");
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching bills:", error);
      return [];
    }
  },

  /**
   * Get a single bill by ID
   */
  async getById(id: string): Promise<Bill | null> {
    try {
      const res = await fetch(`/api/bills/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching bill:", error);
      return null;
    }
  },

  /**
   * Add a new bill
   */
  async add(
    bill: Omit<Bill, "id" | "createdAt" | "updatedAt">
  ): Promise<Bill | null> {
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding bill:", error);
      return null;
    }
  },

  /**
   * Update an existing bill
   */
  async update(
    id: string,
    updates: Partial<Omit<Bill, "id" | "createdAt" | "updatedAt">>
  ): Promise<Bill | null> {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating bill:", error);
      return null;
    }
  },

  /**
   * Delete a bill
   */
  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting bill:", error);
      return false;
    }
  },

  /**
   * Get bills due in a specific month
   */
  async getDueDatesForMonth(
    year: number,
    month: number
  ): Promise<
    Array<{
      id: string;
      name: string;
      date: string;
      amount?: number;
      accountId?: string;
    }>
  > {
    const bills = await this.getAll();
    return bills
      .filter((b) => b.recurrence === "monthly" || !b.recurrence)
      .map((b) => {
        const day = Math.min(Math.max(1, b.dueDay), 28);
        const date = new Date(year, month, day);
        return {
          id: b.id,
          name: b.name,
          date: date.toISOString(),
          amount: b.amount || b.minAmount,
          accountId: b.accountId,
        };
      });
  },
};

/**
 * PaySchedule helpers
 */
export const PayScheduleStorage = {
  async getAll(): Promise<PaySchedule[]> {
    try {
      const res = await fetch("/api/pay-schedule");
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching pay schedules:", error);
      return [];
    }
  },

  async getById(id: string): Promise<PaySchedule | null> {
    try {
      const res = await fetch(`/api/pay-schedule/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching pay schedule:", error);
      return null;
    }
  },

  async add(
    schedule: Omit<PaySchedule, "id" | "createdAt" | "updatedAt">
  ): Promise<PaySchedule | null> {
    try {
      const res = await fetch("/api/pay-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error creating pay schedule:", error);
      return null;
    }
  },

  async update(
    id: string,
    schedule: Partial<Omit<PaySchedule, "id" | "createdAt" | "updatedAt">>
  ): Promise<PaySchedule | null> {
    try {
      const res = await fetch(`/api/pay-schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating pay schedule:", error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/pay-schedule/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting pay schedule:", error);
      return false;
    }
  },

  // Legacy method for backward compatibility
  async get(): Promise<PaySchedule | null> {
    const schedules = await this.getAll();
    return schedules.length > 0 ? schedules[0] : null;
  },

  // Legacy method for backward compatibility
  async set(
    schedule: Omit<PaySchedule, "id" | "createdAt" | "updatedAt">
  ): Promise<PaySchedule | null> {
    return this.add(schedule);
  },

  /**
   * Compute paydays for a given month based on schedule.
   */
  async getPaydaysForMonth(year: number, month: number): Promise<string[]> {
    const schedule = await this.get();
    if (!schedule) return [];

    const paydays: string[] = [];
    if (schedule.frequency === "bi-weekly") {
      const anchor = new Date(schedule.nextPayDate);
      if (isNaN(anchor.getTime())) return [];

      const monthEnd = new Date(year, month + 1, 0);

      const cursor = new Date(anchor);
      while (cursor.getTime() > monthEnd.getTime()) {
        cursor.setDate(cursor.getDate() - 14);
      }

      while (cursor.getTime() < new Date(year, month + 1, 7).getTime()) {
        if (cursor.getFullYear() === year && cursor.getMonth() === month) {
          paydays.push(new Date(cursor).toISOString());
        }
        cursor.setDate(cursor.getDate() + 14);
      }
    }

    return paydays;
  },
};

/**
 * Pay Period helpers
 */
export const PayPeriodStorage = {
  async getAll(): Promise<PayPeriod[]> {
    try {
      const res = await fetch("/api/pay-periods");
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching pay periods:", error);
      return [];
    }
  },

  async getById(id: string): Promise<PayPeriod | null> {
    try {
      const res = await fetch(`/api/pay-periods/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching pay period:", error);
      return null;
    }
  },

  async add(
    period: Omit<PayPeriod, "id" | "createdAt" | "updatedAt">
  ): Promise<PayPeriod | null> {
    try {
      const res = await fetch("/api/pay-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(period),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding pay period:", error);
      return null;
    }
  },

  async update(
    id: string,
    updates: Partial<Omit<PayPeriod, "id" | "createdAt" | "updatedAt">>
  ): Promise<PayPeriod | null> {
    try {
      const res = await fetch(`/api/pay-periods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating pay period:", error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/pay-periods/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting pay period:", error);
      return false;
    }
  },
};

/**
 * Planned Payment helpers
 */
export const PlannedPaymentStorage = {
  async getAll(): Promise<PlannedPayment[]> {
    try {
      const res = await fetch("/api/planned-payments");
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching planned payments:", error);
      return [];
    }
  },

  async getById(id: string): Promise<PlannedPayment | null> {
    try {
      const res = await fetch(`/api/planned-payments/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching planned payment:", error);
      return null;
    }
  },

  async add(
    payment: Omit<PlannedPayment, "id" | "createdAt">
  ): Promise<PlannedPayment | null> {
    try {
      const res = await fetch("/api/planned-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding planned payment:", error);
      return null;
    }
  },

  async update(
    id: string,
    updates: Partial<Omit<PlannedPayment, "id" | "createdAt">>
  ): Promise<PlannedPayment | null> {
    try {
      const res = await fetch(`/api/planned-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating planned payment:", error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/planned-payments/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting planned payment:", error);
      return false;
    }
  },
};

/**
 * Transaction management helpers
 */
export const TransactionStorage = {
  /**
   * Get all transactions with optional filters
   */
  async getAll(filters?: {
    type?: string;
    fromAccountId?: string;
    toAccountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.fromAccountId)
        params.append("fromAccountId", filters.fromAccountId);
      if (filters?.toAccountId)
        params.append("toAccountId", filters.toAccountId);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);

      const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  },

  /**
   * Add a new transaction
   */
  async add(
    transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Transaction | null> {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
  },

  /**
   * Update an existing transaction
   */
  async update(
    id: string,
    updates: Partial<
      Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">
    >
  ): Promise<Transaction | null> {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error updating transaction:", error);
      return null;
    }
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  },

  /**
   * Get transactions by account (from or to)
   */
  async getByAccount(accountId: string): Promise<Transaction[]> {
    try {
      const [fromTransactions, toTransactions] = await Promise.all([
        this.getAll({ fromAccountId: accountId }),
        this.getAll({ toAccountId: accountId }),
      ]);
      // Combine and remove duplicates
      const allTransactions = [...fromTransactions, ...toTransactions];
      const uniqueMap = new Map(allTransactions.map((t) => [t.id, t]));
      return Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error("Error fetching account transactions:", error);
      return [];
    }
  },

  /**
   * Get transactions for a date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    return this.getAll({ startDate, endDate });
  },

  /**
   * Get transactions by type
   */
  async getByType(type: string): Promise<Transaction[]> {
    return this.getAll({ type });
  },
};

// Keep the old Storage class for backward compatibility with settings
export class Storage {
  private static isClient = typeof window !== "undefined";

  static get<T>(key: string): T | null {
    if (!this.isClient) return null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from storage (key: ${key}):`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isClient) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (key: ${key}):`, error);
      return false;
    }
  }
}

export const StorageKeys = {
  SETTINGS: "settings",
} as const;
