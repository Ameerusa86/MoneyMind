// lib/csv/parseTransactions.ts
import { TransactionType, AccountType } from "../types";

export interface CsvTransactionRow {
  date: string;
  type: TransactionType;
  amount: number;
  description?: string;
  category?: string;
  fromAccountId?: string;
  toAccountId?: string;
  metadata?: Record<string, any>;
}

export interface ParseOptions {
  accountType?: AccountType;
}

// CSV line parser that handles quoted fields with commas
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes ("")
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
}

export function parseCsvTextToTransactions(
  text: string,
  options?: ParseOptions
): CsvTransactionRow[] {
  // Normalize BOM and line endings
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = parseCsvLine(lines[0].replace(/^\uFEFF/, ""));
  const headerLower = header.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headerLower.indexOf(name.toLowerCase());

  // Required: Date, Description, Amount
  const dateIdx = idx("date");
  const descriptionIdx = idx("description");
  const amountIdx = idx("amount");

  // Validate mandatory columns
  if (dateIdx === -1 || descriptionIdx === -1 || amountIdx === -1) {
    return [];
  }

  const accountType = options?.accountType || "checking";
  const result: CsvTransactionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (!row.length) continue;

    const rawDate = row[dateIdx] || "";
    let date = rawDate.trim();

    // Convert bank style M/D/YYYY or M/D/YY to ISO YYYY-MM-DD
    const mdY = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2,4})$/;
    const mdYMatch = date.match(mdY);
    if (mdYMatch) {
      const m = mdYMatch[1].padStart(2, "0");
      const d = mdYMatch[2].padStart(2, "0");
      let y = mdYMatch[3];
      if (y.length === 2) y = (Number(y) < 50 ? "20" : "19") + y; // naive century
      date = `${y}-${m}-${d}`;
    }

    // Amount: strip commas
    const amtStr = (row[amountIdx] || "").replace(/,/g, "").trim();
    const amount = Number(amtStr);

    // Basic validation
    if (!date || Number.isNaN(amount) || amount === 0) {
      continue;
    }

    const description = row[descriptionIdx] || "";
    const descLower = description.toLowerCase();

    // Account-type specific sign interpretation
    let type: TransactionType;
    let finalAmount: number;

    if (accountType === "checking" || accountType === "savings") {
      // CHECKING/SAVINGS: Negative = Payment/Expense, Positive = Refund/Income
      if (amount < 0) {
        // Negative = money out (payment/expense)
        finalAmount = Math.abs(amount);
        if (/payment|pmt|bill pay/.test(descLower)) {
          type = "payment";
        } else {
          type = "expense";
        }
      } else {
        // Positive = money in (refund/income)
        finalAmount = amount;
        if (/refund|credit|return/.test(descLower)) {
          type = "payment"; // refund treated as payment type
        } else {
          type = "income_deposit";
        }
      }
    } else if (accountType === "credit") {
      // CREDIT CARD: Positive = Expense, Negative = Payment/Refund
      if (amount > 0) {
        // Positive = expense (charge)
        finalAmount = amount;
        type = "expense";
      } else {
        // Negative = payment or refund
        finalAmount = Math.abs(amount);
        if (/refund|credit|return/.test(descLower)) {
          type = "payment"; // refund
        } else {
          type = "payment"; // payment toward balance
        }
      }
    } else if (accountType === "loan") {
      // LOAN: Negative = Payment, Positive = Interest
      if (amount < 0) {
        // Negative = payment toward loan
        finalAmount = Math.abs(amount);
        type = "payment";
      } else {
        // Positive = interest charge
        finalAmount = amount;
        type = "expense"; // Interest treated as expense
      }
    } else {
      // Fallback (shouldn't happen with proper account types)
      finalAmount = Math.abs(amount);
      type = amount < 0 ? "payment" : "expense";
    }

    result.push({
      date,
      type,
      amount: finalAmount,
      description,
      category: undefined, // Will be set during manual categorization
      fromAccountId: undefined,
      toAccountId: undefined,
      metadata: undefined,
    });
  }

  return result;
}
