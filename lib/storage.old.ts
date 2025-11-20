// Storage abstraction for client-side persistence
// Uses localStorage initially; can be swapped for backend later

const STORAGE_VERSION = "1.0.0";
const VERSION_KEY = "wallet_wave_version";

export class Storage {
  private static isClient = typeof window !== "undefined";

  /**
   * Get an item from storage
   */
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

  /**
   * Set an item in storage
   */
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

  /**
   * Remove an item from storage
   */
  static remove(key: string): boolean {
    if (!this.isClient) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static clear(): boolean {
    if (!this.isClient) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  }

  /**
   * Get all keys from storage
   */
  static keys(): string[] {
    if (!this.isClient) return [];

    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("Error getting storage keys:", error);
      return [];
    }
  }

  /**
   * Check storage version and handle migrations if needed
   */
  static checkVersion(): boolean {
    const currentVersion = this.get<string>(VERSION_KEY);

    if (!currentVersion) {
      this.set(VERSION_KEY, STORAGE_VERSION);
      return true;
    }

    if (currentVersion !== STORAGE_VERSION) {
      console.warn(
        `Storage version mismatch. Current: ${currentVersion}, Expected: ${STORAGE_VERSION}`
      );
      // Future: Add migration logic here
      return false;
    }

    return true;
  }

  /**
   * Export all data as JSON
   */
  static exportData(): string {
    if (!this.isClient) return "{}";

    const data: Record<string, unknown> = {};
    const keys = this.keys();

    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        data[key] = value;
      }
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  static importData(json: string): boolean {
    if (!this.isClient) return false;

    try {
      const data = JSON.parse(json) as Record<string, unknown>;

      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
      }

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }
}

// Storage keys
export const StorageKeys = {
  PAY_SCHEDULE: "pay_schedule",
  PAY_PERIODS: "pay_periods",
  ACCOUNTS: "accounts",
  BILLS: "bills",
  EXPENSES: "expenses",
  PLANNED_PAYMENTS: "planned_payments",
  SETTINGS: "settings",
} as const;

// Type imports
import type { Expense, Account } from "./types";
import type { Bill, PaySchedule } from "./types";

/**
 * Expense management helpers
 */
export const ExpenseStorage = {
  /**
   * Get all expenses
   */
  getAll(): Expense[] {
    return Storage.get<Expense[]>(StorageKeys.EXPENSES) || [];
  },

  /**
   * Get a single expense by ID
   */
  getById(id: string): Expense | null {
    const expenses = this.getAll();
    return expenses.find((e) => e.id === id) || null;
  },

  /**
   * Add a new expense
   */
  add(expense: Omit<Expense, "id" | "createdAt">): Expense {
    const expenses = this.getAll();
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    Storage.set(StorageKeys.EXPENSES, expenses);
    return newExpense;
  },

  /**
   * Update an existing expense
   */
  update(
    id: string,
    updates: Partial<Omit<Expense, "id" | "createdAt">>
  ): Expense | null {
    const expenses = this.getAll();
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) return null;

    expenses[index] = { ...expenses[index], ...updates };
    Storage.set(StorageKeys.EXPENSES, expenses);
    return expenses[index];
  },

  /**
   * Delete an expense
   */
  delete(id: string): boolean {
    const expenses = this.getAll();
    const filtered = expenses.filter((e) => e.id !== id);

    if (filtered.length === expenses.length) return false;

    Storage.set(StorageKeys.EXPENSES, filtered);
    return true;
  },

  /**
   * Get expenses for a specific month
   */
  getByMonth(year: number, month: number): Expense[] {
    const expenses = this.getAll();
    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  },

  /**
   * Get expenses by category
   */
  getByCategory(category: string): Expense[] {
    const expenses = this.getAll();
    return expenses.filter((expense) => expense.category === category);
  },

  /**
   * Get total expenses for a date range
   */
  getTotalForRange(startDate: string, endDate: string): number {
    const expenses = this.getAll();
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
  getCategoryBreakdown(year: number, month: number): Record<string, number> {
    const expenses = this.getByMonth(year, month);
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
  getAll(): Account[] {
    return Storage.get<Account[]>(StorageKeys.ACCOUNTS) || [];
  },

  /**
   * Get a single account by ID
   */
  getById(id: string): Account | null {
    const accounts = this.getAll();
    return accounts.find((a) => a.id === id) || null;
  },
};

/**
 * Bill management helpers
 */
export const BillStorage = {
  /**
   * Get all bills
   */
  getAll(): Bill[] {
    return Storage.get<Bill[]>(StorageKeys.BILLS) || [];
  },

  /**
   * Get bills due in a specific month (assumes monthly recurrence by default)
   */
  getDueDatesForMonth(
    year: number,
    month: number
  ): Array<{
    id: string;
    name: string;
    date: string;
    amount?: number;
    accountId?: string;
  }> {
    const bills = this.getAll();
    return bills
      .filter((b) => b.recurrence === "monthly" || !b.recurrence)
      .map((b) => {
        const day = Math.min(Math.max(1, b.dueDay), 28); // avoid invalid dates (28 as safe cap)
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
  get(): PaySchedule | null {
    return Storage.get<PaySchedule>(StorageKeys.PAY_SCHEDULE);
  },

  /**
   * Compute paydays for a given month based on schedule.
   * Currently supports bi-weekly; other frequencies return empty array.
   */
  getPaydaysForMonth(year: number, month: number): string[] {
    const schedule = this.get();
    if (!schedule) return [];

    const paydays: string[] = [];
    if (schedule.frequency === "bi-weekly") {
      const anchor = new Date(schedule.nextPayDate);
      if (isNaN(anchor.getTime())) return [];

      // Find a payday within or just before the target month
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // Step backwards by 14 days until anchor <= monthEnd
      let cursor = new Date(anchor);
      while (cursor.getTime() > monthEnd.getTime()) {
        cursor.setDate(cursor.getDate() - 14);
      }
      // Step forward adding all occurrences within month range (with small buffer)
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
