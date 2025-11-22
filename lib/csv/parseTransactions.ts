// lib/csv/parseTransactions.ts
import { TransactionType } from "../types";

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

export function parseCsvTextToTransactions(text: string): CsvTransactionRow[] {
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

    // NEW LOGIC: Positive = Expense, Negative = Income/Deposit
    let type: TransactionType;
    let finalAmount: number;

    if (amount > 0) {
      // Positive amount = expense (money spent)
      type = "expense";
      finalAmount = amount;
    } else {
      // Negative amount = income/deposit (money received)
      // Convert to positive for storage
      finalAmount = Math.abs(amount);

      // Try to classify the type of income based on description
      if (/payment|pmt|repay|refund/.test(descLower)) {
        type = "payment"; // This is a refund/payment received
      } else {
        type = "income_deposit"; // Regular income/deposit
      }
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
