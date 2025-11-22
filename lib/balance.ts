// Balance calculation utilities
// Calculate real-time account balances from transaction history

import type { Account, Transaction } from "./types";

/**
 * Calculate the current balance for an account based on its transaction history
 *
 * Logic:
 * - Checking/Savings: Start with initial balance, add income_deposits, subtract payments/expenses/transfers-out
 * - Credit Cards/Loans: Start with 0 (or initial balance), add expenses, subtract payments
 *
 * IMPORTANT: This function calculates the CURRENT balance by applying all transactions
 * to the opening balance. The stored account.balance represents the opening/baseline balance,
 * NOT the current balance. To get current balance, always call this function.
 *
 * @param account The account to calculate balance for
 * @param transactions All transactions for this account (filtered by fromAccountId or toAccountId)
 * @param upToDate Optional ISO date string - calculate balance as of this date
 * @returns Calculated balance
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[],
  upToDate?: string
): number {
  // Use stored balance as the OPENING/BASELINE balance
  // This should be the balance BEFORE any transactions in the system
  let balance = account.balance;

  // Filter by date if specified
  let relevantTxns = transactions;
  if (upToDate) {
    const cutoffDate = new Date(upToDate);
    relevantTxns = transactions.filter((t) => new Date(t.date) <= cutoffDate);
  }

  // Sort by date ascending (oldest first)
  relevantTxns.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const txn of relevantTxns) {
    if (account.type === "checking" || account.type === "savings") {
      // For bank accounts:
      // - Add: income_deposit (toAccountId matches)
      // - Subtract: payment, expense, transfer (fromAccountId matches)
      if (txn.toAccountId === account.id) {
        // Money coming in
        balance += txn.amount;
      } else if (txn.fromAccountId === account.id) {
        // Money going out
        balance -= txn.amount;
      }
    } else if (account.type === "credit" || account.type === "loan") {
      // For debt accounts (credit cards, loans):
      // - Add: expense (increases debt) - fromAccountId matches
      // - Subtract: payment (decreases debt) - toAccountId matches
      if (txn.fromAccountId === account.id && txn.type === "expense") {
        // Charge on card increases balance (debt)
        balance += txn.amount;
      } else if (txn.toAccountId === account.id && txn.type === "payment") {
        // Payment toward card decreases balance (debt)
        balance -= txn.amount;
      }
    }
  }

  return balance;
}

/**
 * Calculate balances for multiple accounts in one pass
 * More efficient than calling calculateAccountBalance multiple times
 *
 * @param accounts Array of accounts
 * @param allTransactions All transactions (will be filtered per account)
 * @param upToDate Optional ISO date string - calculate balances as of this date
 * @returns Map of accountId -> calculated balance
 */
export function calculateAccountBalances(
  accounts: Account[],
  allTransactions: Transaction[],
  upToDate?: string
): Map<string, number> {
  const balances = new Map<string, number>();

  // Group transactions by account (both from and to)
  const txnsByAccount = new Map<string, Transaction[]>();
  for (const account of accounts) {
    txnsByAccount.set(account.id, []);
  }

  for (const txn of allTransactions) {
    if (txn.fromAccountId && txnsByAccount.has(txn.fromAccountId)) {
      txnsByAccount.get(txn.fromAccountId)!.push(txn);
    }
    if (txn.toAccountId && txnsByAccount.has(txn.toAccountId)) {
      txnsByAccount.get(txn.toAccountId)!.push(txn);
    }
  }

  // Calculate balance for each account
  for (const account of accounts) {
    const accountTxns = txnsByAccount.get(account.id) || [];
    const balance = calculateAccountBalance(account, accountTxns, upToDate);
    balances.set(account.id, balance);
  }

  return balances;
}
