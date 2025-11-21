/**
 * Demo Data
 * Pre-populated data for demo accounts
 */

import type { Account, Expense, Bill } from "./types";

const DEMO_PREFIX = "demo_";

export function getDemoStorageKey(key: string): string {
  return `${DEMO_PREFIX}${key}`;
}

export function initializeDemoData() {
  if (typeof window === "undefined") return;

  // Check if already initialized
  if (localStorage.getItem(getDemoStorageKey("initialized"))) {
    return;
  }

  // Demo Accounts
  const demoAccounts: Account[] = [
    {
      id: "demo-acc-1",
      name: "Chase Checking",
      type: "checking",
      balance: 3500.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-acc-2",
      name: "Savings Account",
      type: "savings",
      balance: 12000.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-acc-3",
      name: "Chase Freedom Credit Card",
      type: "credit",
      balance: -850.0,
      creditLimit: 5000,
      dueDay: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Demo Expenses
  const demoExpenses: Expense[] = [
    {
      id: "demo-exp-1",
      category: "groceries",
      amount: 45.5,
      description: "Grocery shopping",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-exp-2",
      category: "transportation",
      amount: 60.0,
      description: "Gas station",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-exp-3",
      category: "entertainment",
      amount: 25.0,
      description: "Movie tickets",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  // Demo Bills
  const demoBills: Bill[] = [
    {
      id: "demo-bill-1",
      name: "Netflix",
      amount: 15.99,
      dueDay: 15,
      recurrence: "monthly",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-bill-2",
      name: "Electricity",
      amount: 120.0,
      dueDay: 25,
      recurrence: "monthly",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Save to localStorage with demo prefix
  localStorage.setItem(
    getDemoStorageKey("accounts"),
    JSON.stringify(demoAccounts)
  );
  localStorage.setItem(
    getDemoStorageKey("expenses"),
    JSON.stringify(demoExpenses)
  );
  localStorage.setItem(getDemoStorageKey("bills"), JSON.stringify(demoBills));
  localStorage.setItem(getDemoStorageKey("transactions"), JSON.stringify([]));
  localStorage.setItem(getDemoStorageKey("initialized"), "true");
}

export function getDemoData<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(getDemoStorageKey(key));
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setDemoData<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getDemoStorageKey(key), JSON.stringify(data));
}

export function clearDemoData() {
  if (typeof window === "undefined") return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(DEMO_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
