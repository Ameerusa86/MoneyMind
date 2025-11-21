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

  let header = parseCsvLine(lines[0].replace(/^\uFEFF/, ""));
  const headerLower = header.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headerLower.indexOf(name.toLowerCase());

  // Detect bank statement format (Date, Description, Amount, Running Bal)
  const isBankFormat =
    idx("date") !== -1 &&
    idx("description") !== -1 &&
    idx("amount") !== -1 &&
    (idx("running bal") !== -1 ||
      idx("running bal.") !== -1 ||
      idx("running bal.") !== -1 ||
      idx("running balance") !== -1);

  const dateIdx = idx("date");
  const typeIdx = isBankFormat ? -1 : idx("type");
  const amountIdx = idx("amount");
  const descriptionIdx = idx("description");
  const categoryIdx = idx("category");
  const fromAccountIdIdx = idx("fromaccountid");
  const toAccountIdIdx = idx("toaccountid");
  const metadataIdx = idx("metadata");
  const runningBalIdx = isBankFormat
    ? ["running bal", "running bal.", "running balance"].reduce(
        (acc, h) => (acc !== -1 ? acc : idx(h)),
        -1
      )
    : -1;

  // Validate mandatory columns
  if (dateIdx === -1 || amountIdx === -1) {
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
    let amount = 0;
    if (amountIdx >= 0) {
      const amtStr = (row[amountIdx] || "").replace(/,/g, "").trim();
      amount = Number(amtStr);
    }

    // Determine type for bank format rows
    let type: TransactionType = "expense";
    if (isBankFormat) {
      const descLower = (row[descriptionIdx] || "").toLowerCase();
      if (amount > 0) {
        if (
          /dir dep|deposit|cash reward|zelle payment from|discover|ems manag/.test(
            descLower
          )
        ) {
          type = "income_deposit";
        } else {
          type = "adjustment";
        }
      } else if (amount < 0) {
        if (/payment|pmt|repay|online banking payment/.test(descLower)) {
          type = "payment";
        } else {
          type = "expense";
        }
      }
    } else {
      type = (row[typeIdx] || "expense") as TransactionType;
    }

    const description =
      descriptionIdx >= 0 ? row[descriptionIdx] || undefined : undefined;
    const category =
      categoryIdx >= 0 ? row[categoryIdx] || undefined : undefined;
    const fromAccountId =
      fromAccountIdIdx >= 0 ? row[fromAccountIdIdx] || undefined : undefined;
    const toAccountId =
      toAccountIdIdx >= 0 ? row[toAccountIdIdx] || undefined : undefined;

    let metadata: Record<string, any> | undefined;
    if (metadataIdx >= 0 && row[metadataIdx]) {
      try {
        metadata = JSON.parse(row[metadataIdx]);
      } catch {
        metadata = { raw: row[metadataIdx] };
      }
    }
    // Capture running balance if present in bank format
    if (runningBalIdx >= 0 && row[runningBalIdx]) {
      const rbStr = row[runningBalIdx].replace(/,/g, "").trim();
      const rbVal = Number(rbStr);
      if (!Number.isNaN(rbVal)) {
        metadata = { ...(metadata || {}), runningBalance: rbVal };
      }
    }

    // basic required fields guard
    if (!date || Number.isNaN(amount)) {
      continue;
    }

    result.push({
      date,
      type,
      amount,
      description,
      category,
      fromAccountId,
      toAccountId,
      metadata,
    });
  }

  return result;
}
